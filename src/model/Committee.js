const mongoose = require('mongoose');
const { Schema } = mongoose;

const committeeGroupSchema = new Schema({
  groupName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  memberSecretary: {
    type: Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  members: [{
    type: Schema.Types.ObjectId,
    ref: 'User', 
  }]
}, {
  timestamps: true, 
});

module.exports = mongoose.model('CommitteeGroup', committeeGroupSchema);
