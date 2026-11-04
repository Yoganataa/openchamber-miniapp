import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { parseDocument } from "yaml";

const workflowDirectory = fileURLToPath(new URL("../.github/workflows/", import.meta.url));
const workflowFiles = (await readdir(workflowDirectory))
  .filter((file) => /\.ya?ml$/i.test(file))
  .sort();

if (workflowFiles.length === 0) {
  throw new Error("No GitHub Actions workflow files were found.");
}

const errors = [];

for (const file of workflowFiles) {
  const source = await readFile(join(workflowDirectory, file), "utf8");
  const document = parseDocument(source, { uniqueKeys: true });

  for (const error of document.errors) {
    errors.push(` ${file}: ${error.message}`);
  }

  if (document.errors.length > 0) {
    continue;
  }

  const workflow = document.toJS();

  if (!workflow || typeof workflow !== "object" || Array.isArray(workflow)) {
    errors.push(` ${file}: workflow document must be a mapping.`);
    continue;
  }

  if (typeof workflow.name !== "string" || workflow.name.trim() === "") {
    errors.push(` ${file}: missing workflow name.`);
  }

  if (!Object.hasOwn(workflow, "on")) {
    errors.push(` ${file}: missing workflow trigger (on).`);
  }

  if (!workflow.jobs || typeof workflow.jobs !== "object" || Array.isArray(workflow.jobs)) {
    errors.push(` ${file}: jobs must be a mapping.`);
    continue;
  }

  for (const [jobId, job] of Object.entries(workflow.jobs)) {
    if (!job || typeof job !== "object" || Array.isArray(job)) {
      errors.push(` ${file}: job "${jobId}" must be a mapping.`);
      continue;
    }

    if (typeof job.uses === "string") {
      continue;
    }

    if (!Array.isArray(job.steps) || job.steps.length === 0) {
      errors.push(` ${file}: job "${jobId}" must define at least one step.`);
      continue;
    }

    for (const [index, step] of job.steps.entries()) {
      if (!step || typeof step !== "object" || Array.isArray(step)) {
        errors.push(` ${file}: job "${jobId}" step ${index + 1} must be a mapping.`);
        continue;
      }

      const hasRun = typeof step.run === "string";
      const hasUses = typeof step.uses === "string";

      if (hasRun === hasUses) {
        errors.push(
          ` ${file}: job "${jobId}" step ${index + 1} must define exactly one of "run" or "uses".`,
        );
      }
    }
  }

  if (document.errors.length === 0) {
    process.stdout.write(`✓ ${file}\n`);
  }
}

// Production database migrations must never silently approve destructive changes.
const migrationWorkflow = await readFile(join(workflowDirectory, "migrate-tgcloud.yml"), "utf8");
if (!/npx tgcloud migrate --safe\b/.test(migrationWorkflow)) {
  errors.push(' migrate-tgcloud.yml: non-interactive migration must use `npx tgcloud migrate --safe`.');
}
if (/npx tgcloud migrate --yes\b/.test(migrationWorkflow)) {
  errors.push(" migrate-tgcloud.yml: --yes can approve destructive warnings and is not allowed in the production migration workflow.");
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`Validated ${workflowFiles.length} GitHub Actions workflow(s).\n`);
}
