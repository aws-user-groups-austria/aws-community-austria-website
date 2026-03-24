import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { USER_GROUPS, type UserGroup } from "../data/groups";

interface SessionizeSession {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  speakers: { id: string; name: string }[];
}

const styles = {
  hero: {
    padding: "60px 40px",
    background: "linear-gradient(180deg, #1E2538 0%, #161E2D 100%)",
    borderBottom: "3px solid #A66FF0",
  },
  backLink: {
    fontSize: "14px",
    color: "#A66FF0",
    textDecoration: "none",
    marginBottom: "16px",
    display: "inline-block",
  },
  groupName: {
    fontSize: "40px",
    fontWeight: 900,
    color: "#FFFFFF",
    marginBottom: "8px",
  },
  groupCity: {
    fontSize: "18px",
    color: "#A66FF0",
    fontWeight: 600,
    marginBottom: "16px",
  },
  groupDesc: {
    fontSize: "16px",
    color: "#D8D8D8",
    lineHeight: 1.6,
    maxWidth: "700px",
    marginBottom: "24px",
  },
  linkRow: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
  linkButton: {
    display: "inline-block",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#FFFFFF",
    background: "#A66FF0",
  },
  linkOutline: {
    display: "inline-block",
    padding: "10px 24px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 600,
    textDecoration: "none",
    color: "#A66FF0",
    border: "2px solid #A66FF0",
    background: "transparent",
  },
  section: {
    padding: "40px",
    maxWidth: "900px",
    margin: "0 auto",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "24px",
  },
  sectionBar: {
    width: "40px",
    height: "4px",
    background: "#A66FF0",
    borderRadius: "2px",
    marginBottom: "12px",
  },
  card: {
    background: "#1E2538",
    borderRadius: "10px",
    padding: "24px",
    marginBottom: "16px",
    border: "1px solid #2F2B52",
  },
  talkTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "8px",
  },
  talkSpeaker: {
    fontSize: "14px",
    color: "#A66FF0",
    fontWeight: 600,
  },
  talkDesc: {
    fontSize: "13px",
    color: "#D8D8D8",
    marginTop: "8px",
    lineHeight: 1.5,
  },
  emptyState: {
    fontSize: "15px",
    color: "#D8D8D8",
    textAlign: "center" as const,
    padding: "40px 20px",
  },
  agendaRow: {
    display: "flex",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #2F2B52",
  },
  agendaTime: {
    width: "160px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#A66FF0",
  },
  agendaLabel: {
    fontSize: "14px",
    color: "#D8D8D8",
  },
  notFound: {
    textAlign: "center" as const,
    padding: "100px 40px",
    fontSize: "20px",
    color: "#D8D8D8",
  },
};

const defaultAgenda = [
  { time: "17:00 - 18:00", label: "Entry & networking" },
  { time: "18:00 - 18:10", label: "Welcome & introduction" },
  { time: "18:10 - 18:20", label: "Sponsor introduction" },
  { time: "18:20 - 19:00", label: "Talk 1" },
  { time: "19:20 - 20:00", label: "Talk 2" },
  { time: "20:00 - Open End", label: "Networking" },
];

export function GroupPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const group = USER_GROUPS.find((g) => g.id === groupId);
  const [sessions, setSessions] = useState<SessionizeSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!group?.sessionizeApiId) return;

    setLoading(true);
    fetch(`https://sessionize.com/api/v2/${group.sessionizeApiId}/view/Sessions`)
      .then((res) => res.json())
      .then((data) => {
        const allSessions: SessionizeSession[] = [];
        for (const section of data) {
          if (section.sessions) allSessions.push(...section.sessions);
        }
        setSessions(allSessions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [group?.sessionizeApiId]);

  if (!group) {
    return (
      <div style={styles.notFound}>
        <p>User group not found.</p>
        <Link to="/" style={{ color: "#A66FF0" }}>Back to home</Link>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section style={styles.hero}>
        <Link to="/" style={styles.backLink}>&larr; Back to all groups</Link>
        <h1 style={styles.groupName}>{group.name}</h1>
        <div style={styles.groupCity}>{group.city}, Austria</div>
        <p style={styles.groupDesc}>{group.description}</p>
        <div style={styles.linkRow}>
          <a href={group.meetupUrl} target="_blank" rel="noopener noreferrer" style={styles.linkButton}>
            Join on Meetup
          </a>
          <a
            href="https://sessionize.com/aws-community-austria"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.linkOutline}
          >
            Submit a Talk
          </a>
        </div>
      </section>

      {/* Typical Agenda */}
      <section style={styles.section}>
        <div style={styles.sectionBar} />
        <h2 style={styles.sectionTitle}>Typical Meetup Agenda</h2>
        <div style={styles.card}>
          {defaultAgenda.map((item, i) => (
            <div key={i} style={styles.agendaRow}>
              <div style={styles.agendaTime}>{item.time}</div>
              <div style={styles.agendaLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sessions from Sessionize */}
      <section style={styles.section}>
        <div style={styles.sectionBar} />
        <h2 style={styles.sectionTitle}>Upcoming Sessions</h2>

        {loading && <p style={styles.emptyState}>Loading sessions from Sessionize...</p>}

        {!loading && sessions.length === 0 && (
          <div style={styles.card}>
            <p style={styles.emptyState}>
              {group.sessionizeApiId
                ? "No upcoming sessions found."
                : "Sessionize integration will be connected soon. Check back for upcoming sessions!"}
            </p>
          </div>
        )}

        {sessions.map((session) => (
          <div key={session.id} style={styles.card}>
            <div style={styles.talkTitle}>{session.title}</div>
            <div style={styles.talkSpeaker}>
              {session.speakers.map((s) => s.name).join(", ")}
            </div>
            {session.description && (
              <div style={styles.talkDesc}>
                {session.description.slice(0, 200)}
                {session.description.length > 200 ? "..." : ""}
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Host a Meetup */}
      <section style={{ ...styles.section, textAlign: "center" }}>
        <div style={{ ...styles.sectionBar, margin: "0 auto 12px" }} />
        <h2 style={{ ...styles.sectionTitle, marginBottom: "12px" }}>
          Want to host a meetup?
        </h2>
        <p style={{ fontSize: "15px", color: "#D8D8D8", marginBottom: "20px", maxWidth: "500px", margin: "0 auto 20px" }}>
          We are always looking for companies to host our meetups. Provide a venue for
          40-60+ people with catering, and we handle the rest.
        </p>
        <a href="mailto:linda.mohamed@icloud.com" style={styles.linkButton}>
          Get in touch
        </a>
      </section>
    </>
  );
}
