import { Request, Response } from 'express';
import { authenticateUser, registerUser } from '../services/authService';
import { createMeeting, getMeetings } from '../services/meetingService';
import { getActionItems, createActionItem } from '../services/actionItemService';

export const authController = {
    register: async (req: Request, res: Response) => {
        try {
            const user = await registerUser(req.body);
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    login: async (req: Request, res: Response) => {
        try {
            const user = await authenticateUser(req.body);
            res.status(200).json(user);
        } catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
};

export const meetingController = {
    create: async (req: Request, res: Response) => {
        try {
            const meeting = await createMeeting(req.body);
            res.status(201).json(meeting);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    list: async (req: Request, res: Response) => {
        try {
            const meetings = await getMeetings();
            res.status(200).json(meetings);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

export const actionItemController = {
    create: async (req: Request, res: Response) => {
        try {
            const actionItem = await createActionItem(req.body);
            res.status(201).json(actionItem);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },
    list: async (req: Request, res: Response) => {
        try {
            const actionItems = await getActionItems();
            res.status(200).json(actionItems);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};