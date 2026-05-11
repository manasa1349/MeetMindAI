import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

const meetingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: Date, required: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const actionItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
    status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);
const ActionItem = mongoose.model('ActionItem', actionItemSchema);

export { User, Meeting, ActionItem };