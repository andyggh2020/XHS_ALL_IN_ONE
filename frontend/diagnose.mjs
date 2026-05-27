// Quick diagnostic to check key imports
import { z } from "zod";
console.log("zod imported OK, z type:", typeof z);

try {
  const schema = z.object({
    username: z.string().min(3),
    password: z.string().min(6),
  });
  console.log("zod schema created OK");
} catch (e) {
  console.error("zod schema error:", e.message);
}

import { App } from "antd";
console.log("antd App imported OK:", typeof App);

import { BrowserRouter, Route, Routes } from "react-router-dom";
console.log("react-router-dom imported OK");

import React from "react";
console.log("react imported OK:", typeof React);

import ReactDOM from "react-dom/client";
console.log("react-dom/client imported OK:", typeof ReactDOM, "createRoot:", typeof ReactDOM.createRoot);
