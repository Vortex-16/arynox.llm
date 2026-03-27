import { Request, Response } from 'express';
import axios from 'axios';
import DocumentMeta from '../models/DocumentMeta';
import { generateEmbeddings } from '../services/llm.service';
import { queryCollection } from '../services/vectorstore.service';

export const generateAudioOverview = async (req: Request, res: Response) => {
    try {
        const { sourceIds, className, department } = req.body;

        if (!sourceIds || sourceIds.length === 0) {
            return res.status(400).json({ error: 'Please select at least one source.' });
        }

        // ── 1. Get source content from ChromaDB ────────────────────────────
        const docs = await DocumentMeta.find({ _id: { $in: sourceIds } });
        if (docs.length === 0) {
            return res.status(404).json({ error: 'Selected sources not found.' });
        }

        const sourceTitles = docs.map(d => d.title);
        
        // Sum up text from all selected documents
        let combinedText = "";

        for (const doc of docs) {
            const collectionName = doc.chromaCollectionRef || 'college_documents';
            const dummyEmbeddings = await generateEmbeddings(['summary of ' + doc.title]);
            
            // Filter by the specific document name in this collection
            const whereFilter = {
                "$and": [
                    { "source": { "$eq": doc.title } },
                    { "department": { "$eq": doc.department || department } }
                ]
            };

            const results = await queryCollection(collectionName, dummyEmbeddings, 10, whereFilter);
            const docText = results.documents?.[0]?.join('\n\n') || '';
            combinedText += `\n\n--- DOCUMENT: ${doc.title} ---\n${docText}`;
        }

        const truncatedText = combinedText.substring(0, 4000) || 'No content retrieved.';

        // ── 2. Generate the spoken summary via Groq (llama-3.1-8b-instant) ──
        const summaryPrompt = `You are Aria, a warm and friendly university AI tutor. 
Create a clear, engaging spoken audio summary (about 180 words) of the following study material.
Speak directly to the student. Use simple language and a natural, friendly tone.
Do not use markdown, bullet points, or formatting — this will be read aloud.
Start with "Hey! Let's go over what you need to know..." and end with "You've got this!"

Study material:
${truncatedText}

Output: Plain spoken text only. No headers, bullets, or symbols.`;

        const groqRes = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: summaryPrompt }],
                temperature: 0.7,
                max_tokens: 350
            },
            { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
        );

        const transcript: string = groqRes.data.choices[0].message.content.trim();
        console.log(`[Audio] Transcript ready (${transcript.length} chars)`);

        // ── 3. Convert to speech via ElevenLabs (FREE tier) ───────────────
        const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

        if (!ELEVENLABS_API_KEY) {
            // No key — return transcript only for browser TTS fallback
            return res.json({ transcript, audioUrl: null, mode: 'free' });
        }

        try {
            // Voice: "Nicole" — piTKgc9nnfS6Of7h79V (More premium/warm tone)
            // Model: eleven_monolingual_v1 (available on FREE tier)
            const ttsRes = await axios.post(
                'https://api.elevenlabs.io/v1/text-to-speech/piTKgc9nnfS6Of7h79V', // Nicole
                {
                    text: transcript,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        'xi-api-key': ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg'
                    },
                    responseType: 'arraybuffer'
                }
            );

            const audioBase64 = Buffer.from(ttsRes.data as ArrayBuffer).toString('base64');
            const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

            console.log('[Audio] ✅ ElevenLabs synthesis complete');
            return res.json({ transcript, audioUrl, mode: 'premium' });

        } catch (elevenErr: any) {
            const errMsg = elevenErr.response?.data
                ? Buffer.from(elevenErr.response.data).toString('utf8')
                : elevenErr.message;
            console.error('[Audio] ElevenLabs error:', errMsg);
            // Fall back to transcript-only (browser TTS)
            return res.json({ transcript, audioUrl: null, mode: 'free', elevenLabsError: errMsg });
        }

    } catch (err: any) {
        console.error('[Audio Fatal]', err.response?.data || err.message);
        return res.status(500).json({ error: 'Failed to generate audio. Check Groq API key.' });
    }
};
