import URLForm from "../components/URLForm";

export default function Home() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-2">URL Analyzer</h1>
            <p className="text-gray-600">Enter URL to analyze:</p>
            <URLForm />
        </div>
    );
}