import axios from "axios";

export class GithubProfileNotFoundError extends Error {}

export async function scrapeGitHub(username: string) {
  try {
    const userRepos = await axios.get(
      `https://api.github.com/users/${username}/repos`
    );

    const repos = userRepos.data.map((x: any) => ({
      name: x.name,
      description: x.description,
      fullName: x.full_name,
      starCount: x.stargazers_count,
    }));

    return repos;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      throw new GithubProfileNotFoundError(`GitHub user "${username}" was not found`);
    }
    throw err;
  }
}