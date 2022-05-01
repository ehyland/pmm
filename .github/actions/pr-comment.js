const COMMENT_HEADER = '# Release Bot';

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
module.exports = async ({ github, context }) => {
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
};

/**
 * @param {Options} options
 */
const createCommentBody = ({ context }) => `${COMMENT_HEADER}

Release packages with tag \`pr-${context.issue.number}\`

Last published commit \`${context.sha}\`

\`\`\`json
${JSON.stringify(
  {
    'process.env.GITHUB_PR_COMMIT_SHA': process.env.GITHUB_PR_COMMIT_SHA,
  },
  null,
  '  '
)}
\`\`\`
`;
