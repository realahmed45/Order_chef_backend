const express = require("express");
const router = express.Router();
const Staff = require("../models/staff");
const Timesheet = require("../models/Timesheet");
const Restaurant = require("../models/Restaurant");
const { body, validationResult } = require("express-validator");

// Get all staff members
router.get("/", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.find({
      restaurantId: restaurant._id,
      status: { $ne: "terminated" },
    }).sort({ createdAt: -1 });

    res.json({ success: true, staff });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get staff member by ID
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staffMember = await Staff.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!staffMember) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    res.json({ success: true, staff: staffMember });
  } catch (error) {
    console.error("Get staff member error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Create new staff member
router.post(
  "/",
  [
    body("name").notEmpty().trim().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").notEmpty().withMessage("Phone is required"),
    body("role")
      .isIn(["manager", "chef", "server", "cashier", "cleaner", "delivery"])
      .withMessage("Invalid role"),
    body("hourlyRate").isNumeric().withMessage("Hourly rate must be a number"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
      if (!restaurant) {
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });
      }

      // Generate employee ID
      const staffCount = await Staff.countDocuments({
        restaurantId: restaurant._id,
      });
      const employeeId = `EMP${(staffCount + 1).toString().padStart(4, "0")}`;

      // Set department based on role
      let department = "front-of-house";
      if (["chef"].includes(req.body.role)) department = "kitchen";
      if (["manager"].includes(req.body.role)) department = "management";
      if (["delivery"].includes(req.body.role)) department = "delivery";

      const staff = new Staff({
        restaurantId: restaurant._id,
        employeeId,
        department,
        ...req.body,
      });

      await staff.save();

      res.status(201).json({ success: true, staff });
    } catch (error) {
      console.error("Create staff error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Update staff member
router.put(
  "/:id",
  [
    body("name").optional().notEmpty().trim(),
    body("email").optional().isEmail(),
    body("hourlyRate").optional().isNumeric(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
      if (!restaurant) {
        return res
          .status(404)
          .json({ success: false, message: "Restaurant not found" });
      }

      const staff = await Staff.findOneAndUpdate(
        { _id: req.params.id, restaurantId: restaurant._id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!staff) {
        return res
          .status(404)
          .json({ success: false, message: "Staff member not found" });
      }

      res.json({ success: true, staff });
    } catch (error) {
      console.error("Update staff error:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);

// Delete staff member (soft delete)
router.delete("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, restaurantId: restaurant._id },
      { status: "terminated" },
      { new: true }
    );

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    res.json({
      success: true,
      message: "Staff member terminated successfully",
    });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get schedule
router.get("/schedule", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.find({
      restaurantId: restaurant._id,
      status: "active",
    }).select("name role schedule");

    res.json({ success: true, schedule: staff });
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Update schedule
router.put("/schedule", async (req, res) => {
  try {
    const { scheduleUpdates } = req.body; // Array of { staffId, schedule }
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const updatePromises = scheduleUpdates.map((update) =>
      Staff.findOneAndUpdate(
        { _id: update.staffId, restaurantId: restaurant._id },
        { schedule: update.schedule },
        { new: true }
      )
    );

    const updatedStaff = await Promise.all(updatePromises);

    res.json({ success: true, staff: updatedStaff.filter(Boolean) });
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Clock in
router.post("/:id/clock-in", async (req, res) => {
  try {
    const { location, photo } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Check if already clocked in today
    const existingTimesheet = await Timesheet.findOne({
      staffId: staff._id,
      date: {
        $gte: new Date(today),
        $lt: new Date(today + "T23:59:59.999Z"),
      },
    });

    if (
      existingTimesheet &&
      existingTimesheet.clockIn.time &&
      !existingTimesheet.clockOut.time
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Already clocked in" });
    }

    const timesheet =
      existingTimesheet ||
      new Timesheet({
        restaurantId: restaurant._id,
        staffId: staff._id,
        date: new Date(),
      });

    timesheet.clockIn = {
      time: new Date(),
      location,
      photo,
      method: "mobile",
    };

    await timesheet.save();

    // Emit socket event
    const io = req.app.get("io");
    io.to(`restaurant:${restaurant._id}`).emit("staff:clock_in", {
      restaurantId: restaurant._id,
      staff: {
        _id: staff._id,
        name: staff.name,
        role: staff.role,
      },
      time: timesheet.clockIn.time,
    });

    res.json({ success: true, timesheet });
  } catch (error) {
    console.error("Clock in error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Clock out
router.post("/:id/clock-out", async (req, res) => {
  try {
    const { location, photo } = req.body;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const staff = await Staff.findOne({
      _id: req.params.id,
      restaurantId: restaurant._id,
    });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff member not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const timesheet = await Timesheet.findOne({
      staffId: staff._id,
      date: {
        $gte: new Date(today),
        $lt: new Date(today + "T23:59:59.999Z"),
      },
      "clockIn.time": { $exists: true },
      "clockOut.time": { $exists: false },
    });

    if (!timesheet) {
      return res
        .status(400)
        .json({ success: false, message: "No active clock-in found" });
    }

    timesheet.clockOut = {
      time: new Date(),
      location,
      photo,
      method: "mobile",
    };

    await timesheet.save();

    // Emit socket event
    const io = req.app.get("io");
    io.to(`restaurant:${restaurant._id}`).emit("staff:clock_out", {
      restaurantId: restaurant._id,
      staff: {
        _id: staff._id,
        name: staff.name,
        role: staff.role,
      },
      totalHours: timesheet.totalHours,
    });

    res.json({ success: true, timesheet });
  } catch (error) {
    console.error("Clock out error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get timesheet
router.get("/:id/timesheet", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    const query = {
      staffId: req.params.id,
      restaurantId: restaurant._id,
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const timesheets = await Timesheet.find(query)
      .populate("staffId", "name role")
      .sort({ date: -1 });

    const summary = timesheets.reduce(
      (acc, timesheet) => {
        acc.totalHours += timesheet.totalHours || 0;
        acc.regularHours += timesheet.regularHours || 0;
        acc.overtimeHours += timesheet.overtimeHours || 0;
        return acc;
      },
      { totalHours: 0, regularHours: 0, overtimeHours: 0 }
    );

    res.json({ success: true, timesheets, summary });
  } catch (error) {
    console.error("Get timesheet error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
