# Needs triage

This Needs triage action automatically adds a 'Needs triage' tag to the newly opened issue.

## Creating

add a file to `.github/workflows/needs-triage.yml`

```yml
name: needs triage
on:
  issues:
    types: [opened, labeled]
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
      - uses: capdiem/needs-triage@v1.0.0
        with:
          repoToken: ${{ secrets.GITHUB_TOKEN }}
          eventType: ${{ github.event.action }}
          labelName: 'Needs triage'
          secondsUtilLabel: 60,
          goodFirstIssue: true
```

## Inputs

| Name             | Description                                    | Required | Default        |
| ---------------- | ---------------------------------------------- | -------- | -------------- |
| repoToken        | Github token for the repository                | true     | -              |
| eventType        | The activity type of current event             | true     | -              |
| labelName        | Name to be added as the triage                 | false    | 'Needs triage' |
| secondsUtilLabel | Number of seconds before being added as triage | false    | 60             |
| goodsFirstIssue  | Add "good first issue" for newcomeres          | false    | false          |
