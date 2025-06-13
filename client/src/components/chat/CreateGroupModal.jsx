import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/auth-context';
import UserAvatar from '../common/UserAvatar';
import { X, Users, Loader2 } from 'lucide-react';

const CreateGroupModal = ({ isOpen, onClose, contacts, onGroupCreated }) => {
    const { user } = useAuth();
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleUserSelect = (userId) => {
        setSelectedUsers(prev => 
            prev.includes(userId) 
                ? prev.filter(id => id !== userId) 
                : [...prev, userId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!groupName.trim() || selectedUsers.length === 0) {
            setError('Group name and at least one member are required.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const payload = {
                name: groupName,
                participants: selectedUsers,
            };
            const response = await axios.post('/conversations/group', payload);
            if (response.status === 201) {
                onGroupCreated(); // Notify parent to refetch sidebar
                handleClose();
            }
        } catch (err) {
            console.error("Failed to create group:", err);
            setError(err.response?.data?.message || 'Failed to create group.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClose = () => {
        setGroupName('');
        setSelectedUsers([]);
        setError('');
        setIsLoading(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Create a New Group</h2>
                    <button onClick={handleClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X size={20} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="groupName" className="block text-sm font-medium text-slate-700">Group Name</label>
                            <input
                                type="text"
                                id="groupName"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="e.g., Project Team"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Select Members</label>
                            <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
                                {contacts.map(contact => (
                                    <div key={contact._id} className="flex items-center justify-between p-2 hover:bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <UserAvatar user={contact} size={8} />
                                            <span className="text-sm font-medium">{contact.name}</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={selectedUsers.includes(contact._id)}
                                            onChange={() => handleUserSelect(contact._id)}
                                            className="h-4 w-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-600">{error}</p>}
                    </div>
                    <div className="p-4 bg-slate-50 border-t rounded-b-lg flex justify-end gap-3">
                        <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium bg-white border border-slate-300 rounded-md hover:bg-slate-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={isLoading} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;