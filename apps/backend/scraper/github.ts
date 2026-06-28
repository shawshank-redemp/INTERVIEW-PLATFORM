import axios from "axios";

export async function scrapeGitHub(username: string) {
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
}