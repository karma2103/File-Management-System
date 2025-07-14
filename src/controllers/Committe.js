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

    const user = await UserModel.findById(req.session.userId);
    res.render("ViewGroups", {
      user,
      message: "Committee created successfully",
    });
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
      user,
      groups,
      allUsers,
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

    const group = await CommitteeGroup.findById(groupId)
      .populate("memberSecretary")
      .populate("members");

    const users = await UserModel.find(); // for dropdowns

    if (!group) {
      return res.status(404).send("Committee Group not found");
    }

    res.render("EditGroup", {
      group,
      users,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
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

    res.redirect("/committees");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
module.exports = {
  AddGroupMembers,
  addCommittee,
  ViewCommittee,
  editGroup,
  postEditGroup
};
