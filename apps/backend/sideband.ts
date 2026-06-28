import WebSocket from "ws";
import { prisma } from "./db";

export async function initSideband(callId: string, interviewId: string) {
    const url = "wss://api.openai.com/v1/realtime?call_id=" + callId;
    const ws = new WebSocket(url, {
        headers: {
            Authorization: "Bearer " + process.env.OPENAI_KEY,
        },
    });

    const interview = await prisma.interview.findFirst({
        where: {
            id: interviewId
        }
    })

    ws.on("open", function open() {
        console.log("Connected to server.");
     console.log("Sending session.update");
        // Send client events over the WebSocket once connected
        ws.send(
            JSON.stringify({
                type: "session.update",
                session: {
                    type: "realtime",
                   instructions: `
                                You are an experienced senior software engineer conducting a technical interview.

                                Start the interview immediately.

                                Do NOT ask the candidate to introduce themselves.
                                Do NOT ask "Tell me about yourself."
                                Do NOT ask for their background.

                                Your very first sentence MUST be:

                                "Hello! Welcome to your technical interview. I'll ask you 2-3 technical questions based on your GitHub projects and computer science knowledge. Let's begin."

                                Immediately after that, ask your first technical question.

                                Base your questions on:
                                - the candidate's GitHub repositories
                                - Data Structures & Algorithms
                                - Operating Systems
                                - DBMS
                                - Computer Networks
                                - OOP
                                - Web Development

                                Ask one question at a time.

                                Wait for the user's answer before asking the next question.

                                If the user struggles, give a small hint instead of revealing the answer.

                                At the end:
                                - give a short performance summary
                                - thank the candidate

                                GitHub metadata:

                                ${interview?.githubMetadata}
                                `,
                                                },
                                            })
                                        );
                                    });

    ws.on("message", async function incoming(message) {
        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type == "response.done") {
            let contents: {type: string, transcript: string}[] = [];

            parsedMessage.response.output.map((x: any) => {
                contents = [...contents, ...x.content];
            });            
const assistantMessage = contents.filter(x => x.type === "output_audio").map(x => x.transcript).join(" ");
            await prisma.message.create({
                data: {
                    interviewId,
                    type: "Assistant",
                    message: assistantMessage
                }
            })
        }
    });
}