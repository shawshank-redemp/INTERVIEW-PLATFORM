//Zod is just a validation library.
//Its only job is:
//Check whether the data is in the format we expect
//Express → creates the server.Axios → sends requests.Zod → validates data.
//Each library has a different job.
import z from "zod";
export const PreInterviewBody= z.object({
    github:z.string(),
})
