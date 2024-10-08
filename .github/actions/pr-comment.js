const COMMENT_HEADER = '### 🤖 PR Release Bot';

/**
 * @typedef { import('@octokit/openapi-types').components['schemas']['issue-comment'] } Comment
 *
 * @typedef {{
 *   github: import('@octokit/rest').Octokit,
 *   context: import('@actions/github').context
 * }} Options
 *
 */

/**
 * @param {Options} options
 */
export async function run({ github, context }) {
  /**
   * @type {Comment | undefined}
   */
  let comment;

  for await (const { data: comments } of github.paginate.iterator(
    github.rest.issues.listComments,
    {
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
    }
  )) {
    // Search each page for the comment
    comment = comments.find((comment) =>
      comment.body.startsWith(COMMENT_HEADER)
    );

    if (comment) break;
  }

  if (comment) {
    await github.rest.issues.updateComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      body: createCommentBody({ context, github }),
      comment_id: comment.id,
    });
  } else {
    await github.rest.issues.createComment({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
      body: createCommentBody({ context, github }),
    });
  }
}

/**
 * @param {Options} options
 */
const createCommentBody = ({ context }) => `${COMMENT_HEADER}

Packages in this PR have been release with tag \`pr-${context.issue.number}\`

${codeFence}
# install with
curl -o- https://raw.githubusercontent.com/ehyland/pmm/main/install.sh | bash -s -- pr-${context.issue.number}
${codeFence}

Last published change => [\`${process.env.GITHUB_PR_COMMIT_SHA.slice(
  0,
  7
)}\`](https://github.com/${context.repo.owner}/${context.repo.repo}/pull/${
  context.issue.number
}/commits/${process.env.GITHUB_PR_COMMIT_SHA})
`;

const codeFence = '```';
