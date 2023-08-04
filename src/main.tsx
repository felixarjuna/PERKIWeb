import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { Activity } from "./activity/activity.tsx";
import "./index.css";
import { Pastors } from "./pastors/pastors.tsx";
import Prayers from "./prayers/prayers.tsx";
import Schedule from "./schedule/schedule.tsx";
import Takeaway from "./takeaway/page.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/pastors", element: <Pastors /> },
  { path: "/activity", element: <Activity /> },
  { path: "/prayers", element: <Prayers /> },
  { path: "/schedule", element: <Schedule /> },
  { path: "/takeaway", element: <Takeaway /> },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
