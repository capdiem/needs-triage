import * as core from '@actions/core'
import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'

import { wait } from './wait'

declare type Octokit = InstanceType<typeof GitHub>

async function run(): Promise<void> {
  try {
    const eventType = core.getInput('eventType')
    core.debug(`event type: ${eventType}`)

    const token: string = core.getInput('repoToken', { required: true })
    const octokit = github.getOctokit(token)

    const labelName: string = core.getInput('labelName')
    core.debug(`The label name is ${labelName}.`)

    const seconds: string = core.getInput('secondsUtilLabel')
    core.debug(`The number of secondsUtilLabel is ${seconds}.`)

    if (eventType === 'opened') {
      addLabelsWhenOpened(octokit, labelName, seconds)
    } else if (eventType === 'labeled') {
      removeTriageWhenLabeled(octokit, labelName)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

async function addLabelsWhenOpened(
  octokit: Octokit,
  labelName: string,
  seconds: string
): Promise<void> {
  core.debug(new Date().toTimeString())
  await wait(parseInt(seconds, 10) * 1000)
  core.debug(new Date().toTimeString())

  const labels = []

  if (await isGoodFirstIssue(octokit)) {
    labels.push('good first issue')
  }

  if (github.context.issue.number) {
    const data = await listLabelsOnIssue(octokit)
    if (data) {
      if (data.length === 0) {
        labels.push(labelName)
      } else {
        core.debug(`Issue ${github.context.issue.number} has added label.`)
      }
    }
  }

  if (labels.length > 0) {
    await addLabelsToIssue(octokit, labels)
  }
}

async function removeTriageWhenLabeled(
  octokit: Octokit,
  labelName: string
): Promise<void> {
  const labels = await listLabelsOnIssue(octokit)
  if (labels && labels.includes(labelName)) {
    await removeLabelFromIssue(octokit, labelName)
  }
}

async function listLabelsOnIssue(
  octokit: Octokit
): Promise<string[] | undefined> {
  const { owner, repo, number: issue_number } = github.context.issue

  const { status, data } = await octokit.rest.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number
  })
  if (status !== 200) {
    core.debug('failed to list labels on issue.')
    return undefined
  } else {
    return data.map(u => u.name)
  }
}

async function isGoodFirstIssue(octokit: Octokit): Promise<boolean> {
  const enable = core.getInput('goodFirstIssue')
  core.debug(`The value of goodsFirstIssue is ${enable}.`)

  if (enable === 'true') {
    const { owner, repo, number: issue_number } = github.context.issue

    const issue = await octokit.rest.issues.get({ owner, repo, issue_number })
    if (issue.status !== 200) {
      core.debug(`failed to get an issue ${issue_number}`)
      return false
    }

    const creator = issue.data.user?.login
    core.debug(`the issue creator is ${creator}`)

    if (!creator) {
      return false
    }

    const { status, data } = await octokit.rest.issues.listForRepo({
      owner,
      repo,
      creator
    })

    if (status !== 200) {
      core.debug(`failed to list issues for repo.`)
      return false
    }

    return data.length === 0
  }

  return false
}

async function addLabelsToIssue(
  octokit: Octokit,
  labels: string[]
): Promise<void> {
  const { owner, repo, number: issue_number } = github.context.issue

  const { status } = await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number,
    labels
  })

  if (status === 200) {
    core.debug(`labels ${labels} added successfully!`)
  } else {
    core.debug(`failed to add labels ${labels}.`)
  }
}

async function removeLabelFromIssue(
  octokit: Octokit,
  label: string
): Promise<void> {
  const { owner, repo, number: issue_number } = github.context.issue

  const { status } = await octokit.rest.issues.removeLabel({
    owner,
    repo,
    issue_number,
    name: label
  })

  if (status === 200) {
    core.debug(`label ${label} removed successfully!`)
  } else {
    core.debug(`failed to remove label ${label}.`)
  }
}

run()
