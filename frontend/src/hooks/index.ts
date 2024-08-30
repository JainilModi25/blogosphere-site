import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

export interface Blog {
    content: string;
    title: string;
    id: number;
    author: {
        name: string;
    };
}

export const useBlog = ({ id }: { id: string }) => {
    const [loading, setLoading] = useState(true);
    const [blog, setBlog] = useState<Blog | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/api/v1/blog/${id}`, {
                headers: {
                    Authorization: localStorage.getItem("token"),
                },
            })
            .then(response => {
                setBlog(response.data.blog);
            })
            .catch(err => {
                setError("Failed to fetch the blog.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id]);

    return {
        loading,
        blog,
        error,
    };
};

export const useBlogs = () => {
    const [loading, setLoading] = useState(true);
    const [blogs, setBlogs] = useState<Blog[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        axios
            .get(`${BACKEND_URL}/api/v1/blog/bulk`, {
                headers: {
                    Authorization: localStorage.getItem("token"),
                },
            })
            .then(response => {
                setBlogs(response.data.blogs || []);
            })
            .catch(err => {
                setError("Failed to fetch blogs.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    return {
        loading,
        blogs,
        error,
    };
};
