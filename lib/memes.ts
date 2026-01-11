
export interface TextPosition {
    id: string;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    fontSize: number; // base font size (relative to image width)
    maxWidth?: number; // percentage
    color: string;
    stroke: string;
    rotation?: number;
    anchor: "top" | "middle" | "bottom" | "left" | "right";
    allCaps?: boolean;
    style?: "impact" | "label"; // NEW: Differentiate classic top/bottom vs object labeling
}

export interface MemeTemplate {
    id: string;
    name: string;
    url: string;
    width: number;
    height: number;
    boxCount: number;
    textData: TextPosition[];
}

export const MEME_TEMPLATES: MemeTemplate[] = [
    {
        id: "drake",
        name: "Drake Hotline Bling",
        url: "https://i.imgflip.com/30b1gx.jpg",
        width: 1200,
        height: 1200,
        boxCount: 2,
        textData: [
            { id: "text0", x: 75, y: 25, fontSize: 60, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
            { id: "text1", x: 75, y: 75, fontSize: 60, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" }
        ]
    },
    {
        id: "distracted",
        name: "Distracted Boyfriend",
        url: "https://i.imgflip.com/1ur9b0.jpg",
        width: 1200,
        height: 800,
        boxCount: 3,
        textData: [
            { id: "text0", x: 20, y: 70, fontSize: 50, maxWidth: 25, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Girlfriend
            { id: "text1", x: 47, y: 50, fontSize: 50, maxWidth: 25, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Boyfriend
            { id: "text2", x: 75, y: 65, fontSize: 50, maxWidth: 25, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Passing Girl
        ]
    },
    {
        id: "two-buttons",
        name: "Two Buttons",
        url: "https://i.imgflip.com/1g8my4.jpg",
        width: 600,
        height: 908,
        boxCount: 2,
        textData: [
            { id: "text0", x: 30, y: 15, fontSize: 30, maxWidth: 25, color: "black", stroke: "white", anchor: "middle", rotation: -10, allCaps: true, style: "label" }, // Left Button - Moved up slightly
            { id: "text1", x: 65, y: 17, fontSize: 30, maxWidth: 25, color: "black", stroke: "white", anchor: "middle", rotation: -10, allCaps: true, style: "label" }, // Right Button - Moved up slightly
        ]
    },
    {
        id: "change-mind",
        name: "Change My Mind",
        url: "https://i.imgflip.com/24y43o.jpg",
        width: 482,
        height: 361,
        boxCount: 1,
        textData: [
            { id: "text0", x: 63, y: 72, fontSize: 30, maxWidth: 55, color: "black", stroke: "transparent", anchor: "middle", rotation: -6, allCaps: false, style: "label" }, // On the paper -> usually small, black text, no stroke
        ]
    },
    {
        id: "exit-ramp",
        name: "Left Exit 12 Off Ramp",
        url: "https://i.imgflip.com/22bdq6.jpg",
        width: 804,
        height: 767,
        boxCount: 2,
        textData: [
            { id: "text0", x: 28, y: 35, fontSize: 40, maxWidth: 25, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Sign
            { id: "text1", x: 50, y: 35, fontSize: 40, maxWidth: 25, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Car
        ]
    },
    {
        id: "batman",
        name: "Batman Slapping Robin",
        url: "https://i.imgflip.com/9ehk.jpg",
        width: 400,
        height: 387,
        boxCount: 2,
        textData: [
            { id: "text0", x: 25, y: 15, fontSize: 40, maxWidth: 45, color: "white", stroke: "black", anchor: "top", allCaps: true, style: "label" }, // Use label to avoid huge impact text blocking faces? Actually batman is usually speech bubbles or labeling faces. Let's stick to label style over faces.
            { id: "text1", x: 75, y: 15, fontSize: 40, maxWidth: 45, color: "white", stroke: "black", anchor: "top", allCaps: true, style: "label" },
        ]
    },
    {
        id: "spongebob",
        name: "Mocking Spongebob",
        url: "https://i.imgflip.com/1otk96.jpg",
        width: 502,
        height: 353,
        boxCount: 2,
        textData: [
            { id: "text0", x: 50, y: 5, fontSize: 45, maxWidth: 90, color: "white", stroke: "black", anchor: "top", allCaps: true, style: "impact" },
            { id: "text1", x: 50, y: 95, fontSize: 45, maxWidth: 90, color: "white", stroke: "black", anchor: "bottom", allCaps: true, style: "impact" },
        ]
    },
    {
        id: "gru-plan",
        name: "Gru's Plan",
        url: "https://i.imgflip.com/145qvv.jpg",
        width: 700,
        height: 449,
        boxCount: 4,
        textData: [
            { id: "text0", x: 25, y: 20, fontSize: 20, maxWidth: 22, color: "black", stroke: "transparent", anchor: "top", allCaps: false, style: "label" },
            { id: "text1", x: 75, y: 20, fontSize: 20, maxWidth: 22, color: "black", stroke: "transparent", anchor: "top", allCaps: false, style: "label" },
            { id: "text2", x: 25, y: 70, fontSize: 20, maxWidth: 22, color: "black", stroke: "transparent", anchor: "top", allCaps: false, style: "label" },
            { id: "text3", x: 75, y: 70, fontSize: 20, maxWidth: 22, color: "black", stroke: "transparent", anchor: "top", allCaps: false, style: "label" },
        ]
    },
    {
        id: "expanding-brain",
        name: "Expanding Brain",
        url: "https://i.imgflip.com/1jwhww.jpg",
        width: 857,
        height: 1202,
        boxCount: 4,
        textData: [
            { id: "text0", x: 25, y: 12, fontSize: 40, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
            { id: "text1", x: 25, y: 37, fontSize: 40, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
            { id: "text2", x: 25, y: 62, fontSize: 40, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
            { id: "text3", x: 25, y: 87, fontSize: 40, maxWidth: 45, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
        ]
    },
    {
        id: "fine",
        name: "This Is Fine",
        url: "https://i.imgflip.com/wxica.jpg",
        width: 580,
        height: 282,
        boxCount: 2,
        textData: [
            { id: "text0", x: 50, y: 5, fontSize: 40, maxWidth: 90, color: "white", stroke: "black", anchor: "top", allCaps: true, style: "impact" },
            { id: "text1", x: 50, y: 95, fontSize: 40, maxWidth: 90, color: "white", stroke: "black", anchor: "bottom", allCaps: true, style: "impact" },
        ]
    },
    {
        id: "sad-pablo",
        name: "Sad Pablo Escobar",
        url: "https://i.imgflip.com/hk01d.jpg",
        width: 720,
        height: 709,
        boxCount: 3,
        textData: [
            { id: "text0", x: 50, y: 15, fontSize: 35, maxWidth: 80, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
            { id: "text1", x: 50, y: 50, fontSize: 35, maxWidth: 80, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
            { id: "text2", x: 50, y: 85, fontSize: 35, maxWidth: 80, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
        ]
    },
    {
        id: "uno",
        name: "Uno Draw 25 Cards",
        url: "https://i.imgflip.com/3lmzyx.jpg",
        width: 500,
        height: 494,
        boxCount: 2,
        textData: [
            { id: "text0", x: 30, y: 40, fontSize: 25, maxWidth: 35, color: "black", stroke: "white", anchor: "middle", allCaps: true, style: "label" },
            { id: "text1", x: 75, y: 25, fontSize: 25, maxWidth: 35, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
        ]
    },
    {
        id: "disaster",
        name: "Disaster Girl",
        url: "https://i.imgflip.com/23ls.jpg",
        width: 500,
        height: 375,
        boxCount: 2,
        textData: [
            { id: "text0", x: 50, y: 5, fontSize: 40, maxWidth: 90, color: "white", stroke: "black", anchor: "top", allCaps: true, style: "impact" },
            { id: "text1", x: 50, y: 95, fontSize: 40, maxWidth: 90, color: "white", stroke: "black", anchor: "bottom", allCaps: true, style: "impact" },
        ]
    },
    {
        id: "epichandshake",
        name: "Epic Handshake",
        url: "https://i.imgflip.com/28j0te.jpg",
        width: 900,
        height: 645,
        boxCount: 3,
        textData: [
            { id: "text0", x: 20, y: 40, fontSize: 50, maxWidth: 30, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
            { id: "text1", x: 80, y: 35, fontSize: 50, maxWidth: 30, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" },
            { id: "text2", x: 50, y: 25, fontSize: 60, maxWidth: 30, color: "white", stroke: "black", anchor: "middle", allCaps: true, rotation: 10, style: "label" },
        ]
    },
    {
        id: "running-away",
        name: "Running Away Balloon",
        url: "https://i.imgflip.com/261o3j.jpg",
        width: 761,
        height: 1024,
        boxCount: 3,
        textData: [
            { id: "text0", x: 10, y: 80, fontSize: 40, maxWidth: 20, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Guy
            { id: "text1", x: 75, y: 60, fontSize: 40, maxWidth: 20, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Pink
            { id: "text2", x: 70, y: 15, fontSize: 40, maxWidth: 30, color: "white", stroke: "black", anchor: "middle", allCaps: true, style: "label" }, // Balloon
        ]
    }
];
