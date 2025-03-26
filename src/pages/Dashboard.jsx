import { useState } from "react";
import { Camera, Image, Upload, Users, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Gallery() {
    const [activeTab, setActiveTab] = useState("home");

    const tabs = [
        { id: "home", name: "Home", icon: <Camera className="w-4 h-4" /> },
        { id: "upload", name: "Upload", icon: <Upload className="w-4 h-4" /> },
        { id: "photos", name: "My Photos", icon: <Image className="w-4 h-4" /> },
        { id: "events", name: "Events", icon: <Users className="w-4 h-4" /> },
        { id: "face-search", name: "Face Search", icon: <Eye className="w-4 h-4" /> },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case "home":
                return <div>Welcome to your photo gallery!</div>;
            case "upload":
                return <div>Upload your photos here.</div>;
            case "photos":
                return <div>View and manage your photos.</div>;
            case "events":
                return <div>Discover events and tagged photos.</div>;
            case "face-search":
                return (
                    <div className="bg-white rounded-apple-2xl shadow-apple p-8 border border-apple-gray-100">
                        <h2 className="text-xl font-semibold text-apple-gray-900 flex items-center">
                            <Eye className="w-5 h-5 mr-2 text-apple-blue-500" />
                            Face Search
                        </h2>
                        <p className="text-apple-gray-600 mb-6 border-l-4 border-apple-blue-500 pl-4 py-2 bg-apple-blue-50 rounded-r-apple">
                            Search for faces in uploaded images.
                        </p>
                        {/* Face search functionality goes here */}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="p-6">
            <div className="flex space-x-4 mb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg ${activeTab === tab.id ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}
                    >
                        {tab.icon} {tab.name}
                    </button>
                ))}
            </div>
            <Card>
                <CardContent>{renderContent()}</CardContent>
            </Card>
        </div>
    );
}
