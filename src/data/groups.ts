/**
 * User group data for the website.
 */

export interface UserGroup {
  id: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  meetupUrl: string;
  sessionizeApiId: string;
  linkedinUrl: string;
  slackChannel: string;
  accentColor: string;
  logoWide: string;
  logoSmall: string;
  /** The hexagon alone, square: for small places like the footer, where the wide logo would be cut. */
  logoIcon: string;
  nextMeetup?: {
    number: number;
    date: string;
    venue: string;
    hostedBy: string;
  };
}

export interface CloudClub {
  id: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  meetupUrl: string;
  logoWide: string | null;
}

/** Student communities (AWS Student Builder Groups, the former AWS Cloud Clubs): shown with the Student Builder Group icon. */
export const CLOUD_CLUBS: CloudClub[] = [
  {
    id: "aws-sbg-stpoelten",
    name: "AWS Student Builder Group St. Pölten",
    shortName: "AWS SBG St. Pölten",
    city: "St. Pölten",
    description: "A student-led AWS Student Builder Group at the University of Applied Sciences St. Pölten, for students to explore AWS together.",
    meetupUrl: "https://www.meetup.com/de-DE/aws-sbg-at-university-of-applied-sciences-st-polten/",
    logoWide: null,
  },
];

/** Groups that are planned but do not exist yet: shown as "coming soon", without details or links. */
export const PLANNED_GROUPS: { name: string; kind: "user group" | "student group" }[] = [
  { name: "AWS User Group St. Pölten", kind: "user group" },
  { name: "AWS User Group Graz", kind: "user group" },
  { name: "Hochschule Burgenland", kind: "student group" },
];

/** The team mailbox: "Contact us", sponsoring, starting a user group anywhere in Austria. */
export const TEAM_EMAIL = "hello@awscommunity.at";
export const START_A_GROUP_EMAIL = TEAM_EMAIL;
/** For a direct question to Linda. */
export const DIRECT_EMAIL = "hello@lindamohamed.com";

/** Members on Meetup: AWS User Group Vienna, and all our groups together (October 2026). */
export const MEMBERS = { vienna: "2,200+", all: "2,600+" } as const;

export const USER_GROUPS: UserGroup[] = [
  {
    id: "aws-ug-vienna",
    name: "AWS User Group Vienna",
    shortName: "AWS UG Vienna",
    city: "Vienna",
    description:
      "The AWS User Group Vienna hosts regular meetups with technical talks about AWS services, architecture patterns, and cloud best practices. Open to everyone interested in AWS.",
    meetupUrl: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    sessionizeApiId: "",
    linkedinUrl: "https://www.linkedin.com/company/aws-user-group-vienna",
    slackChannel: "#aws-ug-vienna",
    accentColor: "#A66FF0",
    logoWide: `${import.meta.env.BASE_URL}assets/logos/ug-vienna-logo-wide.png`,
    logoSmall: `${import.meta.env.BASE_URL}assets/logos/ug-vienna-small.png`,
    logoIcon: `${import.meta.env.BASE_URL}assets/logos/ug-vienna-icon.png`,
  },
  {
    id: "aws-wug-vienna",
    name: "AWS Women's User Group Vienna",
    shortName: "AWS Women's UG Vienna",
    city: "Vienna",
    description:
      "The AWS Women's User Group Vienna is a welcoming space for women and allies to learn, share, and connect around AWS cloud technologies. Everyone is welcome.",
    meetupUrl: "https://www.meetup.com/aws-womens-user-group-vienna/",
    sessionizeApiId: "",
    linkedinUrl: "",
    slackChannel: "#aws-wug-vienna",
    accentColor: "#A66FF0",
    logoWide: `${import.meta.env.BASE_URL}assets/logos/wug-vienna.png`,
    logoSmall: `${import.meta.env.BASE_URL}assets/logos/wug-vienna.png`,
    logoIcon: `${import.meta.env.BASE_URL}assets/logos/wug-vienna-icon.png`,
  },
  {
    id: "aws-ug-linz",
    name: "AWS User Group Linz",
    shortName: "AWS UG Linz",
    city: "Linz",
    description:
      "The AWS User Group Linz brings the AWS community to Upper Austria with meetups focused on cloud engineering, DevOps, and serverless architectures.",
    meetupUrl: "https://www.meetup.com/aws-user-group-linz/",
    sessionizeApiId: "",
    linkedinUrl: "",
    slackChannel: "#aws-ug-linz",
    accentColor: "#A66FF0",
    logoWide: `${import.meta.env.BASE_URL}assets/logos/ug-linz-logo-wide.png`,
    logoSmall: `${import.meta.env.BASE_URL}assets/logos/ug-linz-logo-wide.png`,
    logoIcon: `${import.meta.env.BASE_URL}assets/logos/ug-linz-icon.png`,
  },
];

export interface Organizer {
  name: string;
  role: string;
  focus: string;       // short one-liner shown on homepage cards
  bio: string;         // longer bio shown on team page
  tags: string[];      // highlight tags on team page
  email: string | null;
  linkedin: string | null;
  photo: string | null;
}

export const ORGANIZERS: Organizer[] = [
  {
    name: "Linda Mohamed",
    role: "Co-Organizer",
    focus: "AWS Hero and chairwoman of Förderverein AWS Community DACH",
    bio: "Linda is an AWS Hero and the chairwoman of Förderverein AWS Community DACH e.V., the non-profit that organizes AWS Community Day DACH. She is deeply involved in voluntary community work across the DACH region and helps run all three Austrian user groups. Reach out for anything - she is always happy to help.",
    tags: ["AWS Hero", "AWS CD DACH", "Förderverein", "DACH Community"],
    email: "linda@awscommunity.at",
    linkedin: "https://www.linkedin.com/in/linda-mohamed/",
    photo: "/assets/organizers/Linda.png",
  },
  {
    name: "Dmytro Hlotenko",
    role: "Co-Organizer",
    focus: "Community photographer and AWS Community Day representative",
    bio: "Dima is the face behind our event photos and deeply involved in AWS Community Days all over Europe. He brings the community together beyond Austria, helps coordinate sponsorships, and is a key contact for companies interested in supporting the groups.",
    tags: ["Photography", "AWS Community Days", "Sponsorship", "Europe"],
    email: "dima@awscommunity.at",
    linkedin: "https://www.linkedin.com/in/dmytro-hlotenko-7aa348151/",
    photo: "/assets/organizers/Dmytro.png",
  },
  {
    name: "Philipp Bergsmann",
    role: "Co-Organizer",
    focus: "Open source contributor and AWS UG Vienna veteran",
    bio: "Philipp has been part of AWS User Group Vienna for almost a decade - one of the longest-serving organizers. He works at Red Hat and regularly contributes to open source projects. His deep technical knowledge and long-standing community involvement make him an anchor of the group.",
    tags: ["Red Hat", "Open Source", "AWS UG Vienna", "10 years"],
    email: "philipp@awscommunity.at",
    linkedin: "https://www.linkedin.com/in/phbergsmann/",
    photo: "/assets/organizers/Philipp.png",
  },
  {
    name: "Jakob Heinisch",
    role: "Co-Organizer",
    focus: "Organizational lead and contact person for UG Linz",
    bio: "Jakob handles the organizational backbone of the community - coordination, planning, and logistics. He is the primary contact person for AWS User Group Linz and the go-to person for anything structural or administrative. Everyone else can help with questions too, but Jakob keeps things running.",
    tags: ["Coordination", "UG Linz", "Organizational Lead"],
    email: "jakob@awscommunity.at",
    linkedin: "https://www.linkedin.com/in/jakob-heinisch/",
    photo: "/assets/organizers/Jakob.png",
  },
  {
    name: "Roman Jokel",
    role: "Co-Organizer",
    focus: "Cloud architecture expert and AWS Summit speaker",
    bio: "Roman works at one of our top host and sponsor companies and is deeply involved in modern cloud architectures. He is a regular speaker at AWS Summits, sharing real-world use cases and hands-on experience. His practical perspective adds a grounded, applied voice to the community.",
    tags: ["Cloud Architecture", "AWS Summit Speaker", "Real-world AWS"],
    email: "roman@awscommunity.at",
    linkedin: "https://www.linkedin.com/in/roman-jokel/",
    photo: "/assets/organizers/Roman.png",
  },
  {
    name: "Matthias",
    role: "Co-Organizer",
    focus: "Quiz master and startup founder behind AWS PubQuiz Austria",
    bio: "Matthias is the brain behind our AWS PubQuiz evenings in Austria - coordinating all quiz questions and keeping the format sharp and fun. Beyond quizzing, he is a startup founder and founding engineer, bringing an entrepreneurial perspective to the community.",
    tags: ["AWS PubQuiz", "Startup Founder", "Quiz Master"],
    email: null,
    linkedin: "https://www.linkedin.com/in/pichler-matthias/",
    photo: "/assets/organizers/Matthias.png",
  },
];
