import express from "express";
import { PreInterviewBody } from "./types";
import { scrapeGitHub } from "./scraper/github";
import cors from "cors";
import { prisma } from "./db";
import { initSideband } from "./sideband";
import { calculateResult } from "./result";

const app = express();

app.use(express.json());
app.use(cors());
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

// ================= PRE INTERVIEW =================

app.post("/api/v1/pre-interview", async (req, res) => {
  try {
    const { success, data } = PreInterviewBody.safeParse(req.body);

    if (!success) {
      return res.status(411).json({
        message: "Incorrect body",
      });
    }

    const githubUrl = data.github.endsWith("/")
      ? data.github.slice(0, -1)
      : data.github;

    const githubUsername = githubUrl.split("/").pop()!;

    console.log("================================");
    console.log("GitHub Username:", githubUsername);

    const githubData = await scrapeGitHub(githubUsername);

    console.log("GitHub Data:");
    console.log(githubData);

    const interview = await prisma.interview.create({
      data: {
        githubMetadata: JSON.stringify(githubData),
        status: "Pre",
      },
    });

    console.log("Interview Created:", interview.id);

    res.json({
      id: interview.id,
    });
  } catch (err) {
    console.error("========== PRE-INTERVIEW ERROR ==========");
    console.error(err);

    res.status(500).json({
      message: "Internal Server Error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

// ================= OPENAI SESSION =================

app.post("/api/v1/session/:interviewId", async (req, res) => {
  const sessionConfig = JSON.stringify({
    type: "realtime",
    model: "gpt-realtime",
    audio: {
      output: {
        voice: "marin",
      },
    },
  });

  const fd = new FormData();
  fd.set("sdp", req.body);
  fd.set("session", sessionConfig);

  try {
    const sdpResponse = await fetch(
      "https://api.openai.com/v1/realtime/calls",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
          "OpenAI-Safety-Identifier": "hashed-user-id",
        },
        body: fd,
      }
    );

    console.log("========== OPENAI RESPONSE ==========");
    console.log("Status:", sdpResponse.status);
    console.log(
      "Content-Type:",
      sdpResponse.headers.get("content-type")
    );

    const location = sdpResponse.headers.get("Location");
const callId = location?.split("/").pop()!;

const sdp = await sdpResponse.text();
res.send(sdp);

initSideband(callId, req.params.interviewId);

    /*
    Remove the return above after debugging.

    const location = sdpResponse.headers.get("Location");
    const callId = location?.split("/").pop()!;

    initSideband(callId, req.params.interviewId);
    */

  } catch (error) {
    console.error("========== OPENAI ERROR ==========");
    console.error(error);

    res.status(500).json({
      error: "Failed to generate token",
    });
  }
});

// ================= SAVE USER MESSAGE =================

app.post("/api/v1/session/user/response/:interviewId", async (req, res) => {
  const { message } = req.body;

  await prisma.message.create({
    data: {
      interviewId: req.params.interviewId!,
      type: "User",
      message,
    },
  });

  res.json({
    message: "Message saved",
  });
});

// ================= RESULT =================

app.get("/api/v1/result/:interviewId", async (req, res) => {
  const interview = await prisma.interview.findFirst({
    where: {
      id: req.params.interviewId,
    },
    include: {
      conversations: true,
    },
  });

  if (!interview) {
    return res.status(411).json({
      message: "Interview not found",
    });
  }

  res.json({
    score: interview.score,
    feedback: interview.feedback,
    transcript: interview.conversations.map((c:any) => ({
      type: c.type,
      content: c.message,
      createdAt: c.createdAt,
    })),
    status: interview.status,
  });

  if (interview.status !== "Done") {
    const result = await calculateResult(interview.conversations);

    await prisma.interview.update({
      where: {
        id: req.params.interviewId,
      },
      data: {
        status: "Done",
        feedback: result.feedback,
        score: result.score,
      },
    });
  }
});

// ================= START SERVER =================

app.listen(3001, () => {
  console.log("🚀 Backend running on http://localhost:3001");
});
