import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Activity } from "./Activity/activity.tsx";
import App from "./App.tsx";
import "./index.css";
import { Pastors } from "./pastors/pastors.tsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/pastors", element: <Pastors /> },
  { path: "/activity", element: <Activity /> },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
