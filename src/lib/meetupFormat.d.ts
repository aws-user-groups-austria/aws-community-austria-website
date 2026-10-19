/** Types for meetupFormat.js (plain JavaScript so the build-time prerender can run it in Node). */
import type { Meetup, MeetupSpeaker } from "../data/meetups";

export const TIME_ZONE: "Europe/Vienna";
export function longDate(iso: string): string;
export function shortDate(iso: string): string;
export function time(iso: string): string;
export function clockAt(iso: string, plusSeconds?: number): string;
export function year(iso: string): number;
export function dateParts(iso: string): { weekday: string; day: string; month: string; year: string };
export function mapsUrl(venue: { name: string; address?: string }): string;
export function timeRange(start: string, end?: string): string;
export function isComing(m: Pick<Meetup, "start" | "end">, now?: number): boolean;
export function meetupPath(id: string): string;
export function presentPath(id: string, at?: string, speed?: number): string;
export function speakerLabel(s: MeetupSpeaker): string;
export function hostsLabel(hosts: { name: string }[] | undefined): string;
export function groupMeetups(meetups: Meetup[], now?: number): { coming: Meetup[]; years: { year: number; meetups: Meetup[] }[] };
export function headerPath(id: string): string;
