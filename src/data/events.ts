export interface MeetupEvent {
  title: string;
  date: string;          // ISO string, or "" if TBA
  venue: string;
  group: string;
  groupId: string;       // matches USER_GROUPS id
  groupUrl: string;
  link: string;
  saveTheDate?: boolean;
}

export const UPCOMING_EVENTS: MeetupEvent[] = [
  {
    title: "AWS UG Vienna Meetup - hosted by bytesource",
    date: "2026-04-22T18:00:00.000Z",
    venue: "bytesource, Vienna",
    group: "AWS UG Vienna",
    groupId: "aws-ug-vienna",
    groupUrl: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    link: "https://www.meetup.com/amazon-web-services-aws-vienna/",
    saveTheDate: true,
  },
  {
    title: "AWS Women's UG Vienna - Next Meetup",
    date: "",
    venue: "Vienna",
    group: "AWS WUG Vienna",
    groupId: "aws-wug-vienna",
    groupUrl: "https://www.meetup.com/aws-womens-user-group-vienna/",
    link: "https://www.meetup.com/aws-womens-user-group-vienna/",
    saveTheDate: false,
  },
];
