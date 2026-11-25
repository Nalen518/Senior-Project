"use strict";

const express = require("express");

// GET /api/resources -> resources grouped by support_group in the frontend.
// The primary crisis contact is returned first.

function resourcesRouter({ models }) {
  const router = express.Router();
  router.get("/", async (req, res) => {
    res.json(await models.resources.listActive());
  });
  return router;
}

module.exports = { resourcesRouter };
