export interface Speaker {
  name: string;
  url?: string;          // LinkedIn or personal page
}

export interface MeetupEvent {
  title: string;
  date: string;          // ISO string, or "" if TBA
  venue: string;
  group: string;
  groupId: string;       // matches USER_GROUPS id
  groupUrl: string;
  link: string;
  saveTheDate?: boolean;
  speakers?: Speaker[];
  sponsorWanted?: boolean;   // shows a "looking for a sponsor" link to /sponsors
  liveEventId?: string;      // event id in public/live/events/; shows "Open the live stream" (a card whose link is in public/live/events/index.json gets it without this)
}

export interface CommunityDay {
  name: string;
  date: string;          // display string
  location: string;
  url: string;
  speakers?: string[];   // our organizers speaking there, by ORGANIZERS name
}

export const UPCOMING_EVENTS: MeetupEvent[] = [
  {
    title: "AWS Meetup Vienna #53 - hosted by RBI",
    date: "2026-10-20T15:00:00.000Z",   // doors open 17:00 Vienna, the Meetup start time; talks from 18:00
    venue: "Raiffeisen Bank International, Mooslackengasse 12, 1190 Wien",
    group: "AWS UG Vienna",
    groupId: "aws-ug-vienna",
    groupUrl: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    link: "https://www.meetup.com/amazon-web-services-aws-vienna/events/316893745/",
    saveTheDate: false,
    speakers: [
      { name: "Roman Jokel", url: "https://www.linkedin.com/in/roman-jokel-99b2b8128/" },   // as on the team page (groups.ts)
      { name: "Mladen Trampic" },
      { name: "Darko Mesaroš", url: "https://www.linkedin.com/in/darko-mesaros/" },
    ],
    sponsorWanted: false,
    liveEventId: "2026-10-20-aws-meetup-vienna-53",
  },
  {
    title: "AWS Women's UG Vienna - Next Meetup Coming Soon",
    date: "",
    venue: "Vienna",
    group: "AWS WUG Vienna",
    groupId: "aws-wug-vienna",
    groupUrl: "https://www.meetup.com/aws-womens-user-group-vienna/",
    link: "https://www.meetup.com/aws-womens-user-group-vienna/",
    saveTheDate: false,
    sponsorWanted: true,
  },
];

export const COMMUNITY_DAYS: CommunityDay[] = [
  {
    name: "AWS Community Day Malta",
    date: "October 15-16, 2026",
    location: "St Julian's, Malta",
    url: "https://www.awscommunityday.mt/",
    speakers: ["Dmytro Hlotenko"],
  },
  {
    name: "AWS Community Day Adria",
    date: "October 22, 2026",
    location: "Ljubljana, Slovenia",
    url: "https://awscommunityadria.com/",
    speakers: ["Linda Mohamed", "Dmytro Hlotenko"],
  },
  {
    name: "AWS Community Day Switzerland",
    date: "October 29, 2026",
    location: "Dietlikon (Zurich), Switzerland",
    url: "https://www.awsug.ch/",
  },
];
