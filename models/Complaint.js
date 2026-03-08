const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Garbage Overflow', 'Water Leakage', 'Pothole', 'Streetlight Failure', 'Drainage Issue', 'Other']
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    default: 'Pending'
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  attachments: [
    {
      filename: String,
      path: String,
      mimetype: String
    }
  ],
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  adminRemarks: {
    type: String,
    default: ''
  },
  statusHistory: [
    {
      status: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      remarks: String,
      updatedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date,
    default: null
  }
});

// Auto-generate complaintId before saving
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = 'CMP' + String(count + 1).padStart(4, '0');
  }
  next();
});

module.exports = mongoose.model('Complaint', complaintSchema);