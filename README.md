# Mindnotes

Mindnotes is a React progressive web app for organizing mental-health concerns before a clinician visit. Its guided prompts adapt the SOCRATES framework for mental-health conversations and produce an editable, printable summary. It is not a diagnostic or treatment tool.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; preview it with `npm run preview`.

## Privacy and support

Interview drafts and saved notes are stored in the browser's local storage on the current device. The app does not send notes to a server. Anyone with access to this browser profile may be able to access or remove that local data; clearing browser storage deletes it. Copy or print notes before changing devices.

US support options are available from the header and footer: call or text 988, use the online chat at 988lifeline.org, or call 911 / go to an emergency room for immediate danger. The app does not assess crisis risk.

## Install and offline use

The web app includes a web manifest and service worker. Open it over HTTPS (or localhost during development) to install it. The service worker caches the app shell and same-origin assets after they have been loaded online.
