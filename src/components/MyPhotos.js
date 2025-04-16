import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useMemo } from 'react';
import { getUserPhotos } from '../services/PhotoService';
import { useAuth } from '../context/AuthContext';
import PhotoDetailsModal from './PhotoDetailsModal';
import { Trash2, RefreshCw, Search, Filter, User, ChevronLeft, ChevronRight } from 'lucide-react';

const MyPhotos = () => {
    // Add useEffect for mount logging
    useEffect(() => {
        console.log('[MyPhotos.jsx] Mounted');
    }, []);
    const { user } = useAuth();
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const photosPerPage = 48; // Match PhotoManager pagination

    useEffect(() => {
        // Fetch photos on component mount
        fetchPhotos();
        // Set up polling for updates (since we no longer have Supabase real-time subscriptions)
        const interval = setInterval(() => {
            fetchPhotos(false); // Refresh quietly (don't show loading state)
        }, 30000); // Every 30 seconds
        setRefreshInterval(interval);
        // Clean up interval on unmount
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, [user]);

    const fetchPhotos = async (showLoading = true) => {
        if (!user)
            return;
        if (showLoading) {
            setLoading(true);
        }
        try {
            const response = await getUserPhotos(user.id);
            if (response.success) {
                setPhotos(response.photos);
                setError(null);
                console.log(`[MyPhotos] Fetched ${response.photos.length} photos for user ${user.id}`);
            }
            else {
                setError(response.error || 'Failed to load photos');
            }
        }
        catch (err) {
            console.error('Error fetching photos:', err);
            setError(err.message || 'An error occurred while fetching photos');
        }
        finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    };

    const handleRefresh = () => {
        fetchPhotos(true);
    };

    const handlePhotoSelect = (photo) => {
        setSelectedPhoto(photo);
    };

    const handleModalClose = () => {
        setSelectedPhoto(null);
    };

    // Filter photos based on search term
    const filteredPhotos = photos.filter(photo => {
        // Search in photo ID, description, location name, etc.
        const searchFields = [
            photo.id,
            photo.description || '',
            photo.location?.name || '',
            ...(photo.matched_users?.map(user => user.fullName || '') || [])
        ].join(' ').toLowerCase();
        return searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredPhotos.length / photosPerPage);
    
    const paginatedPhotos = useMemo(() => {
        const startIndex = (currentPage - 1) * photosPerPage;
        return filteredPhotos.slice(startIndex, startIndex + photosPerPage);
    }, [filteredPhotos, currentPage, photosPerPage]);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo(0, 0);
    };

    return (_jsxs("div", { className: "container mx-auto p-4", children: [
        _jsxs("div", { className: "flex justify-between items-center mb-6", children: [
            _jsx("h2", { className: "text-2xl font-bold", children: "My Photos" }),
            _jsx("div", { className: "flex space-x-2", children: 
                _jsxs("button", { 
                    onClick: handleRefresh, 
                    className: "flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors", 
                    children: [
                        _jsx(RefreshCw, { size: 16, className: "mr-1" }), 
                        _jsx("span", { children: "Refresh" })
                    ] 
                })
            })
        ] }),
        
        _jsxs("div", { className: "mb-6 flex flex-col sm:flex-row gap-4", children: [
            _jsxs("div", { className: "relative flex-grow", children: [
                _jsx("input", { 
                    type: "text", 
                    placeholder: "Search photos...", 
                    value: searchTerm, 
                    onChange: (e) => setSearchTerm(e.target.value), 
                    className: "w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                }),
                _jsx(Search, { size: 18, className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" })
            ] }),
            _jsxs("button", { 
                className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center", 
                children: [
                    _jsx(Filter, { size: 16, className: "mr-2" }), 
                    _jsx("span", { children: "Filter" })
                ] 
            })
        ] }),
        
        loading ? (
            _jsx("div", { className: "flex justify-center items-center h-64", children: 
                _jsx("div", { className: "animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" })
            })
        ) : error ? (
            _jsxs("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md", children: [
                _jsx("p", { children: error }),
                _jsx("button", { 
                    onClick: handleRefresh, 
                    className: "mt-2 text-sm text-red-600 hover:text-red-800 underline", 
                    children: "Try again" 
                })
            ] })
        ) : filteredPhotos.length > 0 ? (
            _jsxs("div", { children: [
                _jsx("div", { className: "text-sm text-gray-600 mb-4", children: 
                    `Showing ${paginatedPhotos.length} of ${filteredPhotos.length} photos`
                }),
                _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", children: 
                    paginatedPhotos.map((photo) => (
                        _jsxs("div", { 
                            className: "border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow", 
                            onClick: () => handlePhotoSelect(photo), 
                            children: [
                                _jsxs("div", { className: "relative w-full aspect-square", children: [
                                    _jsx("img", { 
                                        src: photo.url, 
                                        alt: "User uploaded", 
                                        className: "object-cover w-full h-full" 
                                    }),
                                    photo.matched_users && photo.matched_users.length > 0 && (
                                        _jsxs("div", { 
                                            className: "absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center", 
                                            children: [
                                                _jsx(User, { size: 12, className: "mr-1" }), 
                                                _jsx("span", { children: photo.matched_users.length })
                                            ] 
                                        })
                                    )
                                ] }),
                                _jsxs("div", { className: "p-3", children: [
                                    _jsx("p", { 
                                        className: "text-sm text-gray-600 mb-1", 
                                        children: new Date(photo.created_at).toLocaleDateString() 
                                    }),
                                    photo.description && (
                                        _jsx("p", { 
                                            className: "text-sm text-gray-900 truncate", 
                                            children: photo.description 
                                        })
                                    )
                                ] })
                            ] 
                        }, photo.id)
                    ))
                }),
                totalPages > 1 && (
                    _jsx("div", { className: "mt-8 flex justify-center", children: 
                        _jsxs("nav", { className: "flex items-center", children: [
                            _jsx("button", { 
                                onClick: () => handlePageChange(Math.max(currentPage - 1, 1)),
                                disabled: currentPage === 1,
                                className: "p-2 mr-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed",
                                children: _jsx(ChevronLeft, { size: 18 })
                            }),
                            _jsx("div", { className: "flex space-x-1", children:
                                [...Array(totalPages)].map((_, i) => (
                                    _jsx("button", {
                                        onClick: () => handlePageChange(i + 1),
                                        className: `px-3 py-1 rounded-md ${
                                            currentPage === i + 1
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200'
                                        }`,
                                        children: i + 1
                                    }, i)
                                ))
                            }),
                            _jsx("button", { 
                                onClick: () => handlePageChange(Math.min(currentPage + 1, totalPages)),
                                disabled: currentPage === totalPages,
                                className: "p-2 ml-2 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed",
                                children: _jsx(ChevronRight, { size: 18 })
                            })
                        ] })
                    })
                )
            ] })
        ) : (
            _jsxs("div", { 
                className: "flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg border border-gray-200", 
                children: [
                    _jsx("p", { className: "text-gray-500 mb-2", children: "No photos found" }),
                    _jsx("p", { 
                        className: "text-sm text-gray-400", 
                        children: searchTerm ? 'Try a different search term' : 'Upload some photos to get started' 
                    })
                ] 
            })
        ),
        selectedPhoto && (
            _jsx(PhotoDetailsModal, { photo: selectedPhoto, onClose: handleModalClose })
        )
    ] }));
};

export default MyPhotos;
