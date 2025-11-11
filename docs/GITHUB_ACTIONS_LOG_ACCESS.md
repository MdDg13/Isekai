# GitHub Actions Log Access from Cursor

## Why Cursor Can't See GitHub Actions Logs Directly

Cursor (and I, as the AI assistant) **cannot directly access GitHub Actions logs** because:

1. **Authentication Required**: GitHub Actions logs are stored on GitHub's servers and require authentication to access
2. **No API Access**: I don't have direct API access to GitHub's Actions API
3. **Privacy/Security**: Logs may contain sensitive information (secrets, tokens) that shouldn't be exposed
4. **Network Isolation**: Cursor runs locally and doesn't have network access to GitHub's internal systems

## How Logs Are Made Available

The deployment workflow (`deploy.yml`) saves logs to a `deployment-logs` branch:

1. **During Workflow Execution**:
   - Build logs → `deployment-logs/build-*.log`
   - Wrangler deploy logs → `deployment-logs/wrangler-deploy-*.log`
   - Deployment summary → `deployment-logs/summary-*.md`

2. **After Workflow Completes**:
   - All logs are committed to the `deployment-logs` branch
   - This branch is accessible via git, so Cursor can read it

## How to Access Logs from Cursor

### Method 1: Use `check-logs` Script (Recommended)

```powershell
npm run check-logs
```

This script:
- Fetches the `deployment-logs` branch
- Finds logs for the current commit
- Displays build status, deployment status, and error details
- Shows wrangler deploy logs if available

### Method 2: Manual Git Access

```powershell
# Fetch the logs branch
git fetch origin deployment-logs

# View latest summary
git show origin/deployment-logs:deployment-logs/summary-<commit-sha>.md

# View wrangler log
git show origin/deployment-logs:deployment-logs/wrangler-deploy-<commit-sha>.log
```

### Method 3: GitHub Actions UI

1. Go to: `https://github.com/MdDg13/Isekai/actions`
2. Click on the failed workflow run
3. Click on the failed step
4. Scroll to see the error output

## Improving Log Visibility

The workflow has been enhanced to:

1. **Always Save Logs**: Even on failure, logs are committed to `deployment-logs` branch
2. **Include Error Details**: Wrangler logs are included in the summary markdown
3. **Better Error Messages**: Clear error markers and context in logs

## Troubleshooting

### Logs Not Appearing

If `check-logs` doesn't find logs:

1. **Wait a bit**: The workflow needs to complete and commit logs (usually 1-2 minutes after push)
2. **Check if workflow ran**: Verify the workflow actually ran in GitHub Actions
3. **Check branch**: Ensure logs were pushed to `deployment-logs` branch:
   ```powershell
   git fetch origin deployment-logs
   git log origin/deployment-logs --oneline -5
   ```

### Getting Real-Time Errors

For immediate error visibility:

1. **Watch GitHub Actions**: Open the workflow run in your browser
2. **Check step output**: Each step shows output in real-time
3. **Copy error message**: Share the error with Cursor for diagnosis

## Best Practices

1. **After pushing**: Wait ~2 minutes, then run `npm run check-logs`
2. **On failure**: Check GitHub Actions UI for immediate error details
3. **Share errors**: Copy/paste error messages to Cursor for faster diagnosis
4. **Check logs branch**: Regularly fetch `deployment-logs` branch to see historical logs

