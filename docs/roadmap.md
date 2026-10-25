# PERKIWeb roadmap

What the PERKI Aachen website offers today, and where it is going next.

This page is kept up to date: when a pull request changes what a feature can do,
it updates that feature's row here.

Last checked: 2026-10-25.

## Now, Next, Later

The owner's priorities, in order.

**Now**

1. **Writers' workflow.** Make writing, checking and correcting a takeaway easy.
   - Import takeaways and TL;DRs from the Google Docs ([#86](https://github.com/felixarjuna/PERKIWeb/issues/86)). Done.
   - Correct a published takeaway while it stays online ([#74](https://github.com/felixarjuna/PERKIWeb/issues/74)). Done.
   - One shared draft that writers check together, then send to mita ([#75](https://github.com/felixarjuna/PERKIWeb/issues/75)). Done.
   - Comments and suggested edits say whether they are about the notes or the TL;DR ([#89](https://github.com/felixarjuna/PERKIWeb/issues/89)). In review.
2. **My duties for members** ([#84](https://github.com/felixarjuna/PERKIWeb/issues/84)). Done.

**Next**

3. **Testimonies** ([#71](https://github.com/felixarjuna/PERKIWeb/issues/71)) and **small-group history on the profile** ([#70](https://github.com/felixarjuna/PERKIWeb/issues/70)).
4. **Mita planning and handovers.** Schedule planning ([#37](https://github.com/felixarjuna/PERKIWeb/issues/37), to be split into smaller issues), managing the cooking and cleaning groups (done, [#104](https://github.com/felixarjuna/PERKIWeb/issues/104)), Google Drive access ([#30](https://github.com/felixarjuna/PERKIWeb/issues/30)) and onboarding for new mita ([#72](https://github.com/felixarjuna/PERKIWeb/issues/72)).

**Later**

5. Send the Monday WhatsApp broadcast automatically ([#93](https://github.com/felixarjuna/PERKIWeb/issues/93)) and design more than one role per person ([#63](https://github.com/felixarjuna/PERKIWeb/issues/63)).

## Features

Every row has five fields:

- **Audience:** who uses the feature.
- **Feature:** what it is.
- **User benefit:** what it gives that person, in one sentence.
- **Current status:** Live, In review (PR #n), Planned (#n) or Needs answers (#n).
- **Next gap:** the one most useful next step.

### Newcomers / visitors

| Audience | Feature | User benefit | Current status | Next gap |
| --- | --- | --- | --- | --- |
| Newcomers / visitors | Landing page | I can see when and where PERKI meets, what we do and who preaches, before I visit. | Live | No open issue. |
| Newcomers / visitors | Schedule | I can see the upcoming gatherings and open each one on its own page. | Live | No open issue. |
| Newcomers / visitors | Takeaways | I can read the notes and TL;DR from past gatherings, and search them by word, type or month. | Live | Keep a takeaway online while a correction is checked ([#74](https://github.com/felixarjuna/PERKIWeb/issues/74), PR [#97](https://github.com/felixarjuna/PERKIWeb/pull/97)). |
| Newcomers / visitors | Prayer requests | I can read the prayer requests the fellowship shares. | Live | No open issue. |
| Newcomers / visitors | Sign in and access | I can sign in with Google, or ask for access if I was not invited. | Live | No open issue. |

### Members

| Audience | Feature | User benefit | Current status | Next gap |
| --- | --- | --- | --- | --- |
| Members | Welcome and profile | I fill in my details once, so the fellowship knows how to reach and care for me. | Live | Show my small group on my profile ([#70](https://github.com/felixarjuna/PERKIWeb/issues/70)). |
| Members | Account history | I can see when I joined and how my role changed. | Live | Add small-group entries to the history ([#70](https://github.com/felixarjuna/PERKIWeb/issues/70)). |
| Members | My duties | I can see when I serve and when my group cooks or cleans. | Live | Reminders before a duty, part of the later WhatsApp work ([#93](https://github.com/felixarjuna/PERKIWeb/issues/93)). |
| Members | Groups | I can see which cooking and cleaning group I am in. | Live | Show my group on my profile ([#70](https://github.com/felixarjuna/PERKIWeb/issues/70)). |
| Members | Schedule details | When signed in, I can see who serves at each gathering, with their photos. | Live | No open issue. |
| Members | My prayer requests | I can share a request, keep it private or have it published, and tell others I am praying for theirs. | Live | No open issue. |
| Members | WhatsApp group link | Once my profile is complete, I can join the fellowship's WhatsApp group. | Live | No open issue. |
| Members | Ask to become a writer | I can ask staff for the writer role from my account. | Live | Allow more than one role per person ([#63](https://github.com/felixarjuna/PERKIWeb/issues/63)). |
| Members | Delete my account | I can remove my account and my details myself. | Live | No open issue. |
| Members | Testimony | I can write or attach my born-again testimony and choose who may read it. | Planned ([#71](https://github.com/felixarjuna/PERKIWeb/issues/71)) | Decide which files can be uploaded, how large, and where they are stored. |

### Writers

| Audience | Feature | User benefit | Current status | Next gap |
| --- | --- | --- | --- | --- |
| Writers | Takeaway editor | I write the notes and TL;DR in an editor that shows what readers will see. | Live | No open issue. |
| Writers | My takeaways and due dates | I can see which takeaways I am assigned to and when they are due. | Live | No open issue. |
| Writers | Draft, review and publish | My takeaway stays a draft until it is checked, and only mita put it online. | Live | Targeted feedback is in review ([#89](https://github.com/felixarjuna/PERKIWeb/issues/89)). |
| Writers | Review comments and suggested edits | Other writers can comment on a passage or suggest new text, and I decide what to accept. | Live | Targeted feedback is in review ([#89](https://github.com/felixarjuna/PERKIWeb/issues/89)). |
| Writers | Review inbox | I can see what needs my review and which feedback I still have to handle. | Live | No open issue. |
| Writers | Corrections to published takeaways | I can fix a published takeaway while readers still see the published version. | Live | No open issue. |
| Writers | Shared draft (CaKar) | All writers work on one draft together, then the author sends it to mita. | Live | No open issue. |
| Writers | Feedback on notes or TL;DR | Each comment and suggestion sits next to the text it is about. | In review ([#89](https://github.com/felixarjuna/PERKIWeb/issues/89)) | Owner review of the reading workspace, feedback panel and mobile sheet. |

### Mita & owner (staff)

| Audience | Feature | User benefit | Current status | Next gap |
| --- | --- | --- | --- | --- |
| Mita & owner (staff) | Dashboard | We see at a glance how many people joined and how many finished their profile. | Live | No open issue. |
| Mita & owner (staff) | Member directory and roles | We can find any member, read their details and change their role, with every change recorded. | Live | Design more than one role per person ([#63](https://github.com/felixarjuna/PERKIWeb/issues/63)). |
| Mita & owner (staff) | Invites and access requests | We can invite people before they have an account and answer access requests. | Live | No open issue. |
| Mita & owner (staff) | Schedules | We add gatherings by hand or import them from the schedule sheet, and see open slots in a calendar. | Live | Plan the schedule in the app instead of the sheet ([#37](https://github.com/felixarjuna/PERKIWeb/issues/37)). |
| Mita & owner (staff) | Serving pool | We see who can serve in which role, who is a backup or paused, and who has served least this term. | In review ([#103](https://github.com/felixarjuna/PERKIWeb/issues/103)) | Owner: confirm Litur/PA Besar is one group for leader and liturgist. |
| Mita & owner (staff) | Schedule planning | We pick people from the serving pool, generate a schedule and handle swaps, without the sheet. | Planned ([#37](https://github.com/felixarjuna/PERKIWeb/issues/37)) | The next issues split from #37. |
| Mita & owner (staff) | Group management | We can change the cooking and cleaning groups when they are reshuffled. | Live ([#104](https://github.com/felixarjuna/PERKIWeb/issues/104)) | Pick which group cooks and cleans at each gathering while planning the schedule ([#37](https://github.com/felixarjuna/PERKIWeb/issues/37)). |
| Mita & owner (staff) | Names and guest speakers | Schedule names link to the right member, and guest preachers have their own profiles. | Live | No open issue. |
| Mita & owner (staff) | Publish takeaways | We are the one check before a takeaway goes online. | Live | Publish corrections without taking the takeaway offline (PR [#97](https://github.com/felixarjuna/PERKIWeb/pull/97)). |
| Mita & owner (staff) | Import takeaways from Docs | We bring the notes and TL;DR from the Google Docs into the site with one preview. | Live | No open issue. |
| Mita & owner (staff) | Monday WhatsApp post | We copy a ready-made WhatsApp post for each published takeaway. | Live | Send it automatically ([#93](https://github.com/felixarjuna/PERKIWeb/issues/93), needs answers). |
| Mita & owner (staff) | Prayer review | We check, edit and publish prayer requests before others see them. | Live | No open issue. |
| Mita & owner (staff) | Settings | We change the schedule sheet, documents and group links without a new release. | Live | No open issue. |
| Mita & owner (staff) | Google Drive access | Becoming mita gives me access to the shared Drive folder with my own account. | Planned ([#30](https://github.com/felixarjuna/PERKIWeb/issues/30)) | Design how the site connects to Google Drive. |
| Mita & owner (staff) | Mita onboarding | A new mita gets a short guide to what they can do and where things are. | Needs answers ([#72](https://github.com/felixarjuna/PERKIWeb/issues/72)) | Decide between a checklist page and a guided tour, and which steps are required. |
| Mita & owner (staff) | Automatic WhatsApp broadcast | The Monday post goes to WhatsApp without anyone copying it. | Needs answers ([#93](https://github.com/felixarjuna/PERKIWeb/issues/93)) | Find out which WhatsApp channel the site may post to. |
| Mita & owner (staff) | Several roles per person | A person can be mita and writer, or serve in several teams, at once. | Needs answers ([#63](https://github.com/felixarjuna/PERKIWeb/issues/63)) | Write and agree the roles design first. |
