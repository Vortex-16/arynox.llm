import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { processDocumentAndStore } from '../services/document.service';
import DocumentMeta from '../models/DocumentMeta';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/college-ai';

const mockDocs = [
    {
        title: "Graph_Theory_Decoded.pdf",
        department: "Computer Science",
        className: "2nd Year",
        subject: "Algorithms",
        content: `--- PAGE 1 ---
        Graph theory is the study of graphs, which are mathematical structures used to model pairwise relations between objects. 
        A graph in this context is made up of vertices (also called nodes or points) which are connected by edges (also called links or lines).
        Key concepts include paths, cycles, and connectivity. 
        --- PAGE 2 ---
        In Computer Science, graph theory is fundamental for networking and data structures.
        A "Series" in graph theory can refer to a path of edges connecting consecutive vertices.`
    },
    {
        title: "AI_Foundations_Modern.pdf",
        department: "Computer Science",
        className: "2nd Year",
        subject: "Artificial Intelligence",
        content: `Artificial Intelligence (AI) refers to the simulation of human intelligence in machines that are programmed to think like humans and mimic their actions.
        The term may also be applied to any machine that exhibits traits associated with a human mind such as learning and problem-solving.
        Modern AI uses deep learning and neural networks to process vast amounts of data and perform complex tasks like image recognition and natural language processing.`
    },
    {
        title: "Infinite_Series_Blueprint.pdf",
        department: "Mathematics",
        className: "1st Year",
        subject: "Calculus",
        content: `--- PAGE 1 ---
        In mathematics, an infinite series is the sum of the elements of an infinite sequence of numbers. 
        Generalizing the sum of a finite list of numbers, an infinite series can be represented as the sum of its terms.
        --- PAGE 2 ---
        Common examples include the geometric series and the harmonic series. 
        Convergence is a key property, determining if the sum approaches a finite value.`
    },
    {
        title: "Thermodynamics_Core.pdf",
        department: "Physics",
        className: "3rd Year",
        subject: "Classical Mechanics",
        content: `Thermodynamics is the branch of physics that deals with heat, work, and temperature, and their relation to energy, radiation, and physical properties of matter.
        The four laws of thermodynamics govern the behavior of these quantities. 
        The first law, also known as the Law of Conservation of Energy, states that energy cannot be created or destroyed in an isolated system.`
    }
];

async function seed() {
    try {
        console.log('🌱 Starting Data Seed...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 0. Cleanup
        console.log('🧹 Clearing existing data...');
        await DocumentMeta.deleteMany({});
        // For ChromaDB, we'd normally delete the collection, but we'll just let it overwrite or add.
        // If we want a truly clean ChromaDB, we could call delete on the collection.

        const collectionName = 'college_documents';

        for (const doc of mockDocs) {
            console.log(`\n📄 Processing: ${doc.title}...`);
            
            // 1. Process into ChromaDB
            const chunkCount = await processDocumentAndStore(
                doc.content,
                doc.title,
                collectionName,
                { 
                    className: doc.className, 
                    department: doc.department, 
                    subject: doc.subject 
                }
            );

            // 2. Save Metadata to MongoDB
            const meta = new DocumentMeta({
                title: doc.title,
                department: doc.department,
                className: doc.className,
                subject: doc.subject,
                chromaCollectionRef: collectionName,
                fileUrl: `/uploads/${doc.title.replace(/\s+/g, '_')}`
            });

            await meta.save();
            console.log(`✅ Stored ${chunkCount} chunks and metadata for "${doc.title}"`);
        }

        console.log('\n✨ Seeding Complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seed();
