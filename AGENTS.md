# Portfolio site working rules

## Source of truth

- The checked-out repository is the source of truth. The deployed website may be older and must never overwrite local files.
- Website source lives in `web/`.
- Do not edit generated, cached, snapshot, or deployment-copy directories such as `.wrangler`, `.cf-deploy`, `.tmp`, `.codex-snapshot-*`, npm caches, or `test-results`.

## Visual and interaction constraints

- Preserve the established homepage visual exactly unless the user explicitly requests a visual change.
- Do not add homepage subtitles, explanatory copy, badges, labels, onboarding dialogs, or extra buttons without explicit approval.
- Homepage project items must open their internal detail page with one click.
- Put richer descriptions and demonstrations on detail pages, not on the homepage.
- Make the smallest reviewable change needed. Do not broadly redesign or rewrite the site.

## Verification

- Before editing, inspect `git status` and current files.
- Check JavaScript with `node --check web/responsive.shared.js` when that file changes.
- Preview locally from the repository root with `npx --yes http-server web -p 4173 -c-1`, then open `http://127.0.0.1:4173`.
- Verify relevant desktop and mobile behavior in a real browser before reporting completion.
- Clearly distinguish verified behavior from assumptions.

## Git and deployment

- Work on a task branch named `codex/<short-task>` unless the user explicitly requests otherwise.
- Review the diff before committing. Never discard unrelated user changes.
- Commit and push before switching between Windows and macOS.
- Never deploy automatically. A local preview, Git push, or pull request is not permission to deploy production.
- Do not run `wrangler deploy` or any equivalent production command without explicit user approval in the current conversation.

