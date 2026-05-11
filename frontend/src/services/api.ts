import axios from 'axios';

const API_BASE_URL = 'http://localhost:7000/api'; // Adjust the base URL as needed

// User Authentication
export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Meeting Management
export const createMeeting = async (meetingData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/meetings`, meetingData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getMeetings = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/meetings`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

// Action Item Handling
export const createActionItem = async (actionItemData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/action-items`, actionItemData);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};

export const getActionItems = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/action-items`);
        return response.data;
    } catch (error) {
        throw error.response.data;
    }
};
