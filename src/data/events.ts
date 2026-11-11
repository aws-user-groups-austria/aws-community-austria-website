export interface Speaker {
  name: string;
  url?: string;          // LinkedIn or personal page
}

/** A speaker at a community day who is not one of our organizers. */
export interface GuestSpeaker {
  name: string;
  photo: string;         // path under public/, e.g. "/assets/speakers/darko-mesaros.png"
  url?: string;
  guest: true;
}

/** An organizer by ORGANIZERS name (photo and LinkedIn come from there), or a guest. */
export type CommunityDaySpeaker = string | GuestSpeaker;

export interface MeetupEvent {
  title: string;
  date: string;          // ISO string, or "" if TBA
  venue: string;
  group: string;
  groupId: string;       // matches USER_GROUPS id
  groupUrl: string;
  link: string;
  time?: string;         // shown after the date on the card, e.g. "doors 17:00"
  dateLabel?: string;    // shown instead of "Coming soon" while there is no exact date yet
  saveTheDate?: boolean;
  hosts?: string[];      // host names, logos from src/data/sponsors.ts (a meetup page's hosts win)
  speakers?: Speaker[];
  sponsorWanted?: boolean;   // shows a "looking for a sponsor" link to /sponsors
  meetupId?: string;         // id of its page /meetups/<id>/, when the card's link does not already match one
}

export interface CommunityDay {
  name: string;
  date: string;          // display string
  lastDay: string;       // YYYY-MM-DD, the last day; the card is hidden after it
  location: string;
  url: string;
  speakers?: CommunityDaySpeaker[];   // speaking there: our organizers by name, and guests
  /** Its website and a QR code to it, in public/assets/communitydays/ (see its README): "adria" -> adria.jpg, adria-qr.png */
  pictures?: string;
}

/** A community day's website screenshot and QR code, as site paths. */
export function communityDayPictures(c: CommunityDay): { screenshot: string; qr: string } | null {
  if (!c.pictures) return null;
  const base = `${import.meta.env.BASE_URL}assets/communitydays/${c.pictures}`;
  return { screenshot: `${base}.jpg`, qr: `${base}-qr.png` };
}

export const UPCOMING_EVENTS: MeetupEvent[] = [
  {
    title: "AWS Meetup Vienna #54",
    date: "",   // no exact date yet: the week before re:Invent (Nov 30 - Dec 4, Las Vegas); never on a Monday or Friday
    dateLabel: "Nov 24-26, 2026 (Tue-Thu)",
    venue: "Vienna",
    group: "AWS UG Vienna",
    groupId: "aws-ug-vienna",
    groupUrl: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    link: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    saveTheDate: true,
    sponsorWanted: false,
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
    lastDay: "2026-10-16",
    location: "St Julian's, Malta",
    url: "https://www.awscommunityday.mt/",
    pictures: "malta",
    speakers: ["Dmytro Hlotenko"],
  },
  {
    name: "AWS Community Day Adria",
    date: "October 22, 2026",
    lastDay: "2026-10-22",
    location: "Ljubljana, Slovenia",
    url: "https://awscommunityadria.com/",
    pictures: "adria",
    speakers: [
      "Linda Mohamed",
      "Dmytro Hlotenko",
      { name: "Darko Mesaroš", photo: "/assets/speakers/darko-mesaros.png", url: "https://www.linkedin.com/in/darko-mesaros/", guest: true },
    ],
  },
];

/** Community days not over yet, in Vienna's calendar. */
export function upcomingCommunityDays(now: Date = new Date()): CommunityDay[] {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(now);
  return COMMUNITY_DAYS.filter((c) => c.lastDay >= today);
}
