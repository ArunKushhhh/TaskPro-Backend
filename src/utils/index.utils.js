import ActivityLog from "../models/activity.model.js";

const recordActivity = async (
  userId,
  action,
  resourceType,
  resourceId,
  details
) => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resourceType,
      resourceId,
      details,
    });
  } catch (error) {
    console.log(error);
    // return resourceId.status(500).json({ message: "Internal server error" });
  }
};

export { recordActivity };
