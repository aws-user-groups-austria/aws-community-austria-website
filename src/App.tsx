import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { GroupPage } from "./pages/GroupPage";
import { PrepGuidePage } from "./pages/PrepGuidePage";
import { SponsorsPage } from "./pages/SponsorsPage";
import { TeamPage } from "./pages/TeamPage";
import { MeetupsPage } from "./pages/MeetupsPage";
import { MeetupPage } from "./pages/MeetupPage";
import { OrganizersPage } from "./pages/OrganizersPage";

export function App() {
  return (
    <BrowserRouter basename="/">
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/group/:groupId" element={<GroupPage />} />
          <Route path="/prep-guide" element={<PrepGuidePage />} />
          <Route path="/sponsors" element={<SponsorsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/meetups" element={<MeetupsPage />} />
          <Route path="/meetups/:id" element={<MeetupPage />} />
          <Route path="/organizers" element={<OrganizersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
