const UserModel = require("../model/users");
const CommitteeGroup = require("../model/Committee");

const addCommittee = async (req, res) => {
  const allUsers = await UserModel.find({}).select("user name");
  const user = req.session.userId
    ? UserModel.findById(req.session.userId)
    : null;
  res.render("Committe", { user, allUsers, message: null });
};

const AddGroupMembers = async (req, res) => {
  try {
    let { groupName, memberSecretary, members } = req.body;
    // Ensure members is always an array
    if (!Array.isArray(members)) members = [members];
    const user = await UserModel.findById(req.session.userId);

    const existingGroup = await CommitteeGroup.findOne({ groupName });
    if (existingGroup) {
      req.flash("success", "Group or Committee Already Exists.");
      return res.redirect("/addCommittee");
    }
    // Validate presence
    if (!groupName || !memberSecretary || members.length === 0) {
      return res.status(400).send("All fields are required");
    }

    const newCommittee = new CommitteeGroup({
      groupName,
      memberSecretary,
      members,
    });
    await newCommittee.save();
    res.redirect("/committees");
  } catch (error) {
    console.error("Error creating committee:", error);
    res.status(500).send("Internal Server Error");
  }
};

const ViewCommittee = async (req, res) => {
  try {
    const user = await UserModel.findById(req.session.userId);
    const allUsers = await UserModel.find({}).select("user name");
    const groups = await CommitteeGroup.find()
      .populate("memberSecretary", "name department")
      .populate("members", "name department");
         
    res.render("ViewGroups", {
      user: user || null,
      groups: groups || [],
      allUsers: allUsers || [],
      currentUserId: req.session.userId // Pass current user ID to template
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).send("Internal Server Error");
  }
};

//Edit Group Name
const editGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const user = req.session.userId;
    
    // Find the group and check if current user is the leader
    const group = await CommitteeGroup.findById(groupId).populate("memberSecretary");
    
    if (!group) {
      return res.status(404).send("Group not found");
    }
    const users = await UserModel.find();
    // Check if current user is the group leader
    if (group.memberSecretary._id.toString() !== user.toString()) {
      return res.status(403).send("Access denied. Only group leader can edit this group.");
    }
    
    res.render("EditGroup", {
      group,
      users,
      user
    });
    
  } catch (error) {
    console.error("Error in edit group:", error);
    res.status(500).send("Internal Server Error");
  }
};
//Post Edited Group
const postEditGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { groupName, memberSecretary, members } = req.body;

    // Ensure members is always an array
    const membersArray = Array.isArray(members) ? members : [members];

    const updatedGroup = await CommitteeGroup.findByIdAndUpdate(
      groupId,
      {
        groupName,
        memberSecretary,
        members: membersArray,
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).send("Committee Group not found");
    }
     req.flash("success", "Group details successfully Updated.");
    res.redirect("/committees");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

// Delete The group 
const deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const currentUserId = req.session.userId;

    // Check if user is logged in (might be redundant if requireAuth middleware handles this)
    if (!currentUserId) {
      return res.status(401).json({ 
        success: false, 
        message: "Please log in to perform this action" 
      });
    }

    // Find the group and populate memberSecretary to check leadership
    const group = await CommitteeGroup.findById(groupId).populate("memberSecretary");

    if (!group) {
      return res.status(404).json({ 
        success: false, 
        message: "Group not found" 
      });
    }

    // Check if current user is the group leader (memberSecretary)
    if (!group.memberSecretary || group.memberSecretary._id.toString() !== currentUserId.toString()) {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only the group leader can delete this group." 
      });
    }

    // Delete the group
    await CommitteeGroup.findByIdAndDelete(groupId);

    res.status(200).json({ 
      success: true, 
      message: "Group deleted successfully" 
    });

  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error" 
    });
  }
};
module.exports = {
  AddGroupMembers,
  addCommittee,
  ViewCommittee,
  editGroup,
  postEditGroup,
  deleteGroup
};
