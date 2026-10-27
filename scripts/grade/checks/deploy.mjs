// Built-in check: is the student's app live on Vercel? Finds the production
// deployment that Vercel reports to GitHub, falls back to the roster's
// vercel_url, then loads the page and looks for a marker.
//
// Vercel puts a login in front of deployment URLs by default (Vercel
// Authentication), but not in front of the project's production domain. When
// a URL leads to the Vercel login, the check tries the roster's vercel_url and
// then the production domain worked out from the deployment URL.
export const DEFAULT_MARKER = "Fictional — for educational use.";

const VERCEL_LOGIN = /^https:\/\/vercel\.com\/login/;

/**
 * The production domain for a Vercel deployment URL, a best guess:
 * https://copper-m0-12j5-m6oj94gwm-team-projects.vercel.app → https://copper-m0-12j5.vercel.app
 */
export function productionDomain(url) {
  const match = /^https:\/\/(.+?)-[a-z0-9]{9}-[a-z0-9-]+\.vercel\.app\/?$/.exec(
    url,
  );
  return match ? `https://${match[1]}.vercel.app` : null;
}

async function fromGitHub(ctx) {
  const repo = `repos/${ctx.owner}/${ctx.repoName}`;
  const deployments = await ctx.gh(`${repo}/deployments?per_page=30`);
  const production = deployments.filter((d) =>
    String(d.environment ?? "")
      .toLowerCase()
      .startsWith("production"),
  );
  for (const deployment of production) {
    const [status] = await ctx.gh(
      `${repo}/deployments/${deployment.id}/statuses?per_page=1`,
    );
    const url = status?.environment_url || status?.target_url;
    if (status?.state === "success" && url) return { url, sha: deployment.sha };
  }
  return null;
}

const deployCheck = {
  id: "deploy",
  description: "Vercel deployment",
  criteria: ["DEPLOY"],
  cache: false, // cheap, and a student may deploy without pushing a new commit
  needsWorkspace: false,
  async run(ctx) {
    const marker = ctx.settings.deploy?.marker ?? DEFAULT_MARKER;
    const fail = (detail) => ({
      results: [{ criterion: "DEPLOY", passed: false, detail }],
      errors: [],
    });

    let found = null;
    let lookupError = "";
    try {
      found = await fromGitHub(ctx);
    } catch (error) {
      lookupError = ` (GitHub lookup failed: ${error.message.slice(0, 120)})`;
    }
    if (!found && ctx.student.vercel_url)
      found = { url: ctx.student.vercel_url, sha: null };
    if (!found) return fail(`no Vercel deployment found${lookupError}`);

    // The first URL that answers without a Vercel login decides the result.
    const candidates = [found.url];
    const notes = [];
    let page = null;
    while (candidates.length > 0 && !page) {
      const url = candidates.shift();
      let response;
      try {
        response = await ctx.fetch(url, {
          signal: AbortSignal.timeout(15_000),
        });
      } catch (error) {
        if (notes.length === 0)
          return fail(`${url} didn't respond: ${error.message}`);
        notes.push(`${url} didn't respond`);
        continue;
      }
      if (VERCEL_LOGIN.test(response.url ?? "")) {
        notes.push(`${url} needs a Vercel login`);
        for (const next of [ctx.student.vercel_url, productionDomain(url)]) {
          if (next && next !== url && !candidates.includes(next))
            candidates.push(next);
        }
        continue;
      }
      page = { url, response };
    }
    if (!page) {
      return fail(
        `${notes.join("; ")}. Add the student's public Vercel link ` +
          `(https://<project>.vercel.app) to the roster's vercel_url`,
      );
    }
    const { url, response } = page;
    const used = notes.length > 0 ? `; ${notes.join("; ")}` : "";
    if (!response.ok)
      return fail(`${url} returned HTTP ${response.status}${used}`);
    if (!(await response.text()).includes(marker)) {
      return fail(`${url} is up but doesn't show "${marker}"${used}`);
    }
    const commit =
      found.sha === null
        ? "URL from roster"
        : found.sha === ctx.sha
          ? "deployed commit matches graded commit"
          : `deployed commit ${found.sha.slice(0, 7)} differs from graded commit`;
    return {
      results: [
        {
          criterion: "DEPLOY",
          passed: true,
          detail: `live at ${url} (${commit}${used})`,
        },
      ],
      errors: [],
    };
  },
};

export default deployCheck;
