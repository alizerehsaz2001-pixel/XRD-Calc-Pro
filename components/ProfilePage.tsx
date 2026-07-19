import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { jsPDF } from "jspdf";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  CartesianGrid,
} from "recharts";
import {
  Mail,
  Linkedin,
  Github,
  MapPin,
  ExternalLink,
  Award,
  Code,
  Cpu,
  Globe,
  Terminal,
  Layers,
  ShieldCheck,
  Target,
  Zap,
  Camera,
  Sparkles,
  ChevronRight,
  Activity,
  FileText,
  Microscope,
  Box,
  Brain,
  Database,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Sliders,
  Shield,
  User,
  Save,
  CheckCircle,
  FileBadge,
  Fingerprint,
  Lock,
  Loader2,
  Search,
  Wifi,
  WifiOff,
  Server,
} from "lucide-react";

interface Skill {
  name: string;
  level: number;
}

interface Research {
  title: string;
  status: string;
  progress: number;
  color: "emerald" | "indigo" | "amber" | "rose" | "cyan";
}

interface LinkDetail {
  label: string;
  val: string;
  icon: string;
  url: string;
}

interface Publication {
  title: string;
  journal: string;
  date: string;
}

interface ArchiveItem {
  year: string;
  title: string;
  desc: string;
}

interface LabStats {
  hIndex: number;
  citations: number;
  peerReviews: number;
  scansAnalyzed: number;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  title: string;
  subDescription: string;
  classification: string;
  idReference: string;
  status: string;
  mission: string;
  skills: Skill[];
  research: Research[];
  links: LinkDetail[];
  publications: Publication[];
  archive: ArchiveItem[];
  stats: LabStats;
}

const PRESETS: Record<string, ProfileData> = {
  ali: {
    firstName: "Ali",
    lastName: "Zerehsaz",
    title: "Founder & Laboratory Architect",
    subDescription:
      "Pioneering high-fidelity computational frameworks for experimental physics and neuro-analytical material discovery.",
    classification: "L-5 Senior Director",
    idReference: "AZ-2001-CORE",
    status: "Active",
    mission:
      "To engineer the most intuitive and scientifically accurate platform for diffraction analysis, empowering researchers with instant, high-fidelity insights.",
    skills: [
      { name: "Diffraction Physics", level: 95 },
      { name: "Symmetry Logic", level: 91 },
      { name: "Neural Architecture", level: 87 },
      { name: "Phase Identification", level: 83 },
      { name: "Spectrum Analysis", level: 79 },
      { name: "Lattice Topology", level: 75 },
    ],
    research: [
      {
        title: "Project NEURON (CrystalAI)",
        status: "In Optimization",
        progress: 88,
        color: "indigo",
      },
      {
        title: "Deconvolution Peak Mapping",
        status: "In Progress",
        progress: 65,
        color: "emerald",
      },
    ],
    links: [
      {
        label: "Network Node",
        val: "ali@zerehsaz.dev",
        icon: "Mail",
        url: "mailto:ali@zerehsaz.dev",
      },
      {
        label: "LinkedIn Mesh",
        val: "ali-zerehsaz",
        icon: "Linkedin",
        url: "https://linkedin.com",
      },
      {
        label: "GitHub Forge",
        val: "ali-zerehsaz",
        icon: "Github",
        url: "https://github.com",
      },
    ],
    publications: [
      {
        title: "Neural XRD identification for multicomponent alloys",
        journal: "Nature Materials",
        date: "2025",
      },
      {
        title: "Symmetry group optimization using reinforcement learning",
        journal: "Applied Physics Letters",
        date: "2024",
      },
    ],
    archive: [
      {
        year: "2021",
        title: "Calculus Alpha",
        desc: "Initial physics core developed for basic Bragg diffraction. Foundation of the XRD-Calc engine.",
      },
      {
        year: "2023",
        title: "Macro-Structure Sync",
        desc: "Integration of Williamson-Hall and Warren-Averbach protocols for advanced microstructural mapping.",
      },
      {
        year: "2025",
        title: "Neural PhaseID Nodes",
        desc: "Deployment of the first AI-driven phase identification node, providing probabilistic matching on raw scan data.",
      },
    ],
    stats: {
      hIndex: 42,
      citations: 1840,
      peerReviews: 128,
      scansAnalyzed: 9420,
    },
  },
  bragg: {
    firstName: "Elizabeth",
    lastName: "Bragg",
    title: "Synchrotron Science Division Lead",
    subDescription:
      "Advancing ultra-high flux x-ray scattering methodologies for complex solid-state crystal transformations.",
    classification: "L-5 Lead Investigator",
    idReference: "EB-1890-SYNC",
    status: "Active",
    mission:
      "To maximize structural exploration pathways under extreme atomic pressure conditions using high-luminosity modern beamlines.",
    skills: [
      { name: "Synchrotron Scattering", level: 98 },
      { name: "High-Pressure Crystallography", level: 94 },
      { name: "Bragg Diffraction Optics", level: 90 },
      { name: "Fourier Electron Densities", level: 86 },
      { name: "Sample Rotation Dynamics", level: 82 },
      { name: "X-Ray Safety Protocols", level: 99 },
    ],
    research: [
      {
        title: "Diamond Anvil Cell In-Situ Scans",
        status: "Active Run",
        progress: 92,
        color: "cyan",
      },
      {
        title: "Beamline High-Flux Monochromator",
        status: "Deployment",
        progress: 78,
        color: "rose",
      },
    ],
    links: [
      {
        label: "Synchrotron Node",
        val: "e.bragg@synchrotron.org",
        icon: "Mail",
        url: "mailto:e.bragg@synchrotron.org",
      },
      {
        label: "Research Mesh",
        val: "elizabeth-bragg-xrd",
        icon: "Linkedin",
        url: "https://linkedin.com",
      },
      {
        label: "Optics Forge",
        val: "bragg-diffraction-labs",
        icon: "Github",
        url: "https://github.com",
      },
    ],
    publications: [
      {
        title: "In-situ diffraction under megabar pressures",
        journal: "Science",
        date: "2026",
      },
      {
        title: "Sub-nanosecond beamline pulse timing calibration",
        journal: "Journal of Synchrotron Radiation",
        date: "2025",
      },
    ],
    archive: [
      {
        year: "2020",
        title: "DAC Automation v1",
        desc: "Introduced automated rotational control alignment for diamond anvil cells.",
      },
      {
        year: "2023",
        title: "Multibeam Coherence Fit",
        desc: "Pioneered split-beam crystal indexing algorithms for multi-domain crystallites.",
      },
      {
        year: "2026",
        title: "Megabar Oxide Synthesis",
        desc: "Identified superconducting properties of novel dense oxides using specialized micro-diffraction.",
      },
    ],
    stats: {
      hIndex: 56,
      citations: 3120,
      peerReviews: 240,
      scansAnalyzed: 14250,
    },
  },
  rietveld: {
    firstName: "Joseph",
    lastName: "Rietveld",
    title: "Senior Mathematical Crystallographer",
    subDescription:
      "Formulating rigorous numerical least-squares algorithms for structural profile refinement and multi-phase powder resolving.",
    classification: "L-4 Structure Expert",
    idReference: "JR-1969-REFN",
    status: "Active",
    mission:
      "To eliminate peak fitting residuals by decoupling overlapping lattice parameters and specimen displacement errors systematically.",
    skills: [
      { name: "Least-Squares Refinement", level: 99 },
      { name: "Caglioti Shape Functions", level: 96 },
      { name: "Space Group Symmetry", level: 92 },
      { name: "Texture & Orientation Models", level: 88 },
      { name: "Instrumental Peak Broadening", level: 85 },
      { name: "Anisotropic Microstrain", level: 80 },
    ],
    research: [
      {
        title: "Genetic Algorithm Peak Deconvolution",
        status: "Algorithmic Test",
        progress: 74,
        color: "amber",
      },
      {
        title: "Space-Group Matrix Auto-Resolver",
        status: "Stable Release",
        progress: 95,
        color: "indigo",
      },
    ],
    links: [
      {
        label: "Mathematical Node",
        val: "j.rietveld@structure.edu",
        icon: "Mail",
        url: "mailto:j.rietveld@structure.edu",
      },
      {
        label: "Refinement Link",
        val: "rietveld-refinement-core",
        icon: "Linkedin",
        url: "https://linkedin.com",
      },
      {
        label: "Matrix Codebase",
        val: "rietveld-profile-fit",
        icon: "Github",
        url: "https://github.com",
      },
    ],
    publications: [
      {
        title: "A standard profile refinement algorithm for powder scans",
        journal: "Journal of Applied Crystallography",
        date: "2024",
      },
      {
        title: "Modelling preferred orientation in disordered materials",
        journal: "Acta Crystallographica",
        date: "2023",
      },
    ],
    archive: [
      {
        year: "2019",
        title: "Caglioti Variable Matrix",
        desc: "Coded a highly converging solver loop mapping instrumental peak broadness.",
      },
      {
        year: "2022",
        title: "Integrated Multi-Phase Fit",
        desc: "Upgraded code engine to fit up to 8 crystalline structures concurrently.",
      },
      {
        year: "2025",
        title: "Full Profile Fitting Engine",
        desc: "Achieved fully automatic background subtraction, minimizing user bias error codes.",
      },
    ],
    stats: {
      hIndex: 78,
      citations: 6490,
      peerReviews: 310,
      scansAnalyzed: 18900,
    },
  },
};

const getTrendData = (firstName: string) => {
  const norm = firstName.toLowerCase();

  if (norm.includes("elizabeth") || norm.includes("bragg")) {
    return [
      { year: "2020", citations: 800, papers: 10, hindex: 32 },
      { year: "2021", citations: 1200, papers: 14, hindex: 36 },
      { year: "2022", citations: 1650, papers: 18, hindex: 41 },
      { year: "2023", citations: 2100, papers: 22, hindex: 45 },
      { year: "2024", citations: 2500, papers: 25, hindex: 48 },
      { year: "2025", citations: 2900, papers: 29, hindex: 52 },
      { year: "2026", citations: 3120, papers: 32, hindex: 56 },
    ];
  }
  if (norm.includes("joseph") || norm.includes("rietveld")) {
    return [
      { year: "2020", citations: 2500, papers: 30, hindex: 48 },
      { year: "2021", citations: 3200, papers: 36, hindex: 53 },
      { year: "2022", citations: 4050, papers: 42, hindex: 59 },
      { year: "2023", citations: 4800, papers: 48, hindex: 64 },
      { year: "2024", citations: 5400, papers: 52, hindex: 69 },
      { year: "2025", citations: 6050, papers: 58, hindex: 74 },
      { year: "2026", citations: 6490, papers: 63, hindex: 78 },
    ];
  }
  // Default to Ali Zerehsaz
  return [
    { year: "2020", citations: 400, papers: 3, hindex: 21 },
    { year: "2021", citations: 650, papers: 5, hindex: 25 },
    { year: "2022", citations: 910, papers: 8, hindex: 30 },
    { year: "2023", citations: 1120, papers: 10, hindex: 34 },
    { year: "2024", citations: 1400, papers: 12, hindex: 38 },
    { year: "2025", citations: 1650, papers: 14, hindex: 41 },
    { year: "2026", citations: 1840, papers: 16, hindex: 42 },
  ];
};

interface CatalogItem {
  id: string;
  name: string;
  formula: string;
  crystalSystem: string;
  spaceGroup: string;
  density: string;
  cellParams: string;
  description: string;
  peaks: { twoTheta: number; intensity: number; hkl: string }[];
}

const MOCK_DATABASE_CATALOGS: Record<string, CatalogItem[]> = {
  ICDD: [
    {
      id: "ICDD-00-044-1422",
      name: "Rutile",
      formula: "TiO2",
      crystalSystem: "Tetragonal",
      spaceGroup: "P42/mnm (136)",
      density: "4.23 g/cm³",
      cellParams: "a=4.593 Å, c=2.959 Å",
      description: "Standard titanium dioxide phase. High-temperature refractory and pigment reference standard.",
      peaks: [
        { twoTheta: 27.4, intensity: 100, hkl: "110" },
        { twoTheta: 36.1, intensity: 60, hkl: "101" },
        { twoTheta: 41.2, intensity: 25, hkl: "111" },
        { twoTheta: 54.3, intensity: 80, hkl: "211" },
        { twoTheta: 69.0, intensity: 30, hkl: "301" },
      ],
    },
    {
      id: "ICDD-00-033-1161",
      name: "Quartz",
      formula: "SiO2",
      crystalSystem: "Trigonal",
      spaceGroup: "P3221 (154)",
      density: "2.65 g/cm³",
      cellParams: "a=4.913 Å, c=5.405 Å",
      description: "Low-quartz alpha phase. Primary calibration standard for phase quantification in geosciences.",
      peaks: [
        { twoTheta: 20.8, intensity: 35, hkl: "100" },
        { twoTheta: 26.6, intensity: 100, hkl: "101" },
        { twoTheta: 50.1, intensity: 15, hkl: "112" },
        { twoTheta: 60.0, intensity: 12, hkl: "211" },
        { twoTheta: 68.2, intensity: 20, hkl: "203" },
      ],
    },
    {
      id: "ICDD-01-071-3752",
      name: "Corundum",
      formula: "Al2O3",
      crystalSystem: "Rhombohedral",
      spaceGroup: "R-3c (167)",
      density: "3.98 g/cm³",
      cellParams: "a=4.758 Å, c=12.991 Å",
      description: "Synthetic alpha-alumina standard. International NIST calibration reference for line position and intensity.",
      peaks: [
        { twoTheta: 25.5, intensity: 75, hkl: "012" },
        { twoTheta: 35.1, intensity: 90, hkl: "104" },
        { twoTheta: 43.3, intensity: 100, hkl: "113" },
        { twoTheta: 57.5, intensity: 85, hkl: "116" },
        { twoTheta: 77.2, intensity: 45, hkl: "030" },
      ],
    },
  ],
  COD: [
    {
      id: "COD-1011032",
      name: "Halite",
      formula: "NaCl",
      crystalSystem: "Cubic",
      spaceGroup: "Fm-3m (225)",
      density: "2.17 g/cm³",
      cellParams: "a=5.640 Å",
      description: "Standard rock salt structure. Pure ionic lattice benchmark reference with highly symmetric peaks.",
      peaks: [
        { twoTheta: 27.3, intensity: 15, hkl: "111" },
        { twoTheta: 31.7, intensity: 100, hkl: "200" },
        { twoTheta: 45.4, intensity: 55, hkl: "220" },
        { twoTheta: 56.4, intensity: 30, hkl: "222" },
        { twoTheta: 66.2, intensity: 18, hkl: "400" },
      ],
    },
    {
      id: "COD-9008234",
      name: "Magnetite",
      formula: "Fe3O4",
      crystalSystem: "Cubic",
      spaceGroup: "Fd-3m (227)",
      density: "5.18 g/cm³",
      cellParams: "a=8.397 Å",
      description: "Inversed spinel-type ferrimagnetic mineral oxide. Important for iron metallurgy and nano-magnetism.",
      peaks: [
        { twoTheta: 30.1, intensity: 40, hkl: "220" },
        { twoTheta: 35.4, intensity: 100, hkl: "311" },
        { twoTheta: 43.1, intensity: 20, hkl: "400" },
        { twoTheta: 57.0, intensity: 85, hkl: "511" },
        { twoTheta: 62.6, intensity: 45, hkl: "440" },
      ],
    },
  ],
  RRUFF: [
    {
      id: "RRUFF-R040012",
      name: "Hematite",
      formula: "Fe2O3",
      crystalSystem: "Trigonal",
      spaceGroup: "R-3c (167)",
      density: "5.26 g/cm³",
      cellParams: "a=5.038 Å, c=13.740 Å",
      description: "Most stable iron oxide polymorph. Highly indexed in terrestrial geology and Mars exploration data.",
      peaks: [
        { twoTheta: 24.1, intensity: 45, hkl: "012" },
        { twoTheta: 33.1, intensity: 100, hkl: "104" },
        { twoTheta: 35.6, intensity: 80, hkl: "110" },
        { twoTheta: 54.1, intensity: 65, hkl: "116" },
        { twoTheta: 64.0, intensity: 35, hkl: "300" },
      ],
    },
    {
      id: "RRUFF-R050083",
      name: "Forsterite",
      formula: "Mg2SiO4",
      crystalSystem: "Orthorhombic",
      spaceGroup: "Pbnm (62)",
      density: "3.27 g/cm³",
      cellParams: "a=4.756 Å, b=10.190 Å, c=5.980 Å",
      description: "Magnesium-rich olivine mineral. Important planetary and deep mantle component.",
      peaks: [
        { twoTheta: 22.9, intensity: 30, hkl: "111" },
        { twoTheta: 32.2, intensity: 75, hkl: "131" },
        { twoTheta: 35.6, intensity: 100, hkl: "112" },
        { twoTheta: 36.5, intensity: 90, hkl: "122" },
        { twoTheta: 52.3, intensity: 40, hkl: "222" },
      ],
    },
  ],
  ICSD: [
    {
      id: "ICSD-23918",
      name: "Perovskite",
      formula: "CaTiO3",
      crystalSystem: "Orthorhombic",
      spaceGroup: "Pbnm (62)",
      density: "4.02 g/cm³",
      cellParams: "a=5.381 Å, b=5.443 Å, c=7.645 Å",
      description: "Prototypical calcium titanate framework. Basis for the high-efficiency halide photovoltaic solar cell lattices.",
      peaks: [
        { twoTheta: 23.2, intensity: 25, hkl: "101" },
        { twoTheta: 33.1, intensity: 100, hkl: "121" },
        { twoTheta: 40.7, intensity: 20, hkl: "200" },
        { twoTheta: 47.5, intensity: 55, hkl: "220" },
        { twoTheta: 59.2, intensity: 30, hkl: "240" },
      ],
    },
    {
      id: "ICSD-88201",
      name: "Barium Titanate",
      formula: "BaTiO3",
      crystalSystem: "Tetragonal",
      spaceGroup: "P4mm (99)",
      density: "6.02 g/cm³",
      cellParams: "a=3.992 Å, c=4.036 Å",
      description: "Highly polarizable ferroelectric ceramic. Key component for solid-state capacitors and non-volatile memories.",
      peaks: [
        { twoTheta: 22.1, intensity: 40, hkl: "100" },
        { twoTheta: 31.5, intensity: 100, hkl: "110" },
        { twoTheta: 38.8, intensity: 35, hkl: "111" },
        { twoTheta: 45.2, intensity: 60, hkl: "200" },
        { twoTheta: 56.1, intensity: 25, hkl: "211" },
      ],
    },
  ],
  CSD: [
    {
      id: "CSD-BENZEN12",
      name: "Benzene",
      formula: "C6H6",
      crystalSystem: "Orthorhombic",
      spaceGroup: "Pbca (61)",
      density: "1.01 g/cm³",
      cellParams: "a=7.390 Å, b=9.420 Å, c=6.780 Å",
      description: "Classic aromatic hydrocarbon molecular crystal. Low-temperature organic solid-state packing model.",
      peaks: [
        { twoTheta: 12.3, intensity: 45, hkl: "011" },
        { twoTheta: 18.9, intensity: 100, hkl: "111" },
        { twoTheta: 24.3, intensity: 65, hkl: "200" },
        { twoTheta: 31.1, intensity: 25, hkl: "220" },
        { twoTheta: 35.4, intensity: 15, hkl: "311" },
      ],
    },
    {
      id: "CSD-ASPRIN01",
      name: "Aspirin (Form I)",
      formula: "C9H8O4",
      crystalSystem: "Monoclinic",
      spaceGroup: "P21/c (14)",
      density: "1.40 g/cm³",
      cellParams: "a=11.440 Å, b=6.590 Å, c=11.380 Å, β=95.5°",
      description: "Active pharmaceutical ingredient (API) polymorphic Form I. Benchmark pharmaceutical crystallography standard.",
      peaks: [
        { twoTheta: 7.8, intensity: 40, hkl: "100" },
        { twoTheta: 15.6, intensity: 100, hkl: "110" },
        { twoTheta: 18.2, intensity: 75, hkl: "011" },
        { twoTheta: 22.4, intensity: 50, hkl: "210" },
        { twoTheta: 27.1, intensity: 30, hkl: "121" },
      ],
    },
  ],
};

const generateDiffractionSpectrum = (peaks: { twoTheta: number; intensity: number; hkl: string }[]) => {
  const data = [];
  const width = 0.5; // FWHM peak width
  for (let t = 10; t <= 80; t += 0.5) {
    let intensity = 2 + Math.random() * 1.5; // background noise
    peaks.forEach(p => {
      const diff = t - p.twoTheta;
      intensity += p.intensity / (1 + (diff / width) * (diff / width) * 4);
    });
    data.push({
      twoTheta: t.toFixed(1),
      intensity: parseFloat(intensity.toFixed(1)),
    });
  }
  return data;
};

export const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "dossier" | "configurator" | "credentials"
  >("dossier");
  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return localStorage.getItem("lab_director_custom_avatar") || null;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connection Ping / Security Latency state
  const [dbLatencies, setDbLatencies] = useState<Record<string, string>>({});
  const [isPinging, setIsPinging] = useState(false);

  // Advanced sync state declarations
  const [selectedDb, setSelectedDb] = useState<"ICDD" | "COD" | "RRUFF" | "ICSD" | "CSD" | null>("ICDD");
  const [dbSearchQuery, setDbSearchQuery] = useState("");
  const [selectedCompound, setSelectedCompound] = useState<CatalogItem | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatus, setSyncStatus] = useState<"idle" | "handshake" | "indexing" | "aligning" | "complete">("idle");
  const [syncConsoleLogs, setSyncConsoleLogs] = useState<string[]>([]);

  // Badge Verification status scanner mock
  const [verifiedBadges, setVerifiedBadges] = useState<
    Record<string, "idle" | "scanning" | "verified">
  >({});
  const [verificationLogs, setVerificationLogs] = useState<
    Record<string, string[]>
  >({});

  // jsPDF dynamic download state
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Core profile data loaded from localStorage or default
  const [profile, setProfile] = useState<ProfileData>(() => {
    const saved = localStorage.getItem("lab_director_profile_payload");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // Fallback
      }
    }
    return PRESETS.ali;
  });

  const handlePingDatabases = async () => {
    setIsPinging(true);
    setSyncStatus("handshake");
    setSyncProgress(5);
    setDbLatencies({});
    
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
      setSyncConsoleLogs([...logs]);
    };

    addLog("Initializing Global Sync Sequence...");
    addLog("Checking environment credentials & local database keys...");
    await new Promise((r) => setTimeout(r, 400));
    
    setSyncProgress(15);
    addLog("Securing terminal channels... TLS 1.3 tunnel configured.");
    addLog("Reverse proxy binding check... Port 3000 verified as healthy.");
    await new Promise((r) => setTimeout(r, 500));

    // Phase 1: Handshake
    addLog("PINGING REGIONAL HUBS...");
    const keys = ["ICDD", "COD", "RRUFF", "ICSD", "CSD"] as const;
    const locations: Record<string, string> = {
      ICDD: "Newtown Square, PA, USA (US-EAST)",
      COD: "Vilnius, Lithuania (EU-WEST)",
      RRUFF: "Tucson, AZ, USA (US-WEST)",
      ICSD: "Karlsruhe, Germany (EU-CENTRAL)",
      CSD: "Cambridge, UK (EU-NORTH)"
    };

    setSyncProgress(30);
    setSyncStatus("handshake");

    for (const k of keys) {
      addLog(`Handshaking with ${k} Node (${locations[k]})...`);
      await new Promise((r) => setTimeout(r, 250));
      const lat = (4 + Math.random() * 11).toFixed(1);
      setDbLatencies((prev) => ({
        ...prev,
        [k]: `${lat} ms`,
      }));
      addLog(`[SUCCESS] ${k} acknowledged. Connection speed: ${lat} ms. Encryption: AES-256-GCM.`);
    }

    // Phase 2: Indexing
    setSyncProgress(55);
    setSyncStatus("indexing");
    addLog("COMPARATIVE CATALOG INDEXING START...");
    addLog("Pulling remote manifests and comparing against local indices...");
    await new Promise((r) => setTimeout(r, 600));

    addLog("ICDD: Syncing 485,280 peak profiles... 100% synchronized.");
    addLog("COD: Comparing 512,940 crystal unit cells... matched.");
    addLog("RRUFF: Validating 32,410 Raman structural lines... verified.");
    await new Promise((r) => setTimeout(r, 500));

    // Phase 3: Aligning
    setSyncProgress(80);
    setSyncStatus("aligning");
    addLog("CONVERGENCE ALIGNMENT: Initiating lattice-topology matrix optimizer...");
    addLog("Refining global phase-identification deconvolution overlays...");
    await new Promise((r) => setTimeout(r, 700));
    addLog("All remote database matrices aligned with local XRD-Calc engine.");

    // Phase 4: Complete
    setSyncProgress(100);
    setSyncStatus("complete");
    addLog("SYNCHRONIZATION COMPLETED: Convergence state ACTIVE.");
    addLog("All 5 primary crystallographic reference databases stabilized.");
    setIsPinging(false);
  };

  const handleVerifyBadge = async (badgeId: string) => {
    setVerifiedBadges((prev) => ({ ...prev, [badgeId]: "scanning" }));
    setVerificationLogs((prev) => ({
      ...prev,
      [badgeId]: [
        "[SCAN] Initiating quantum-secured biometric handshake...",
        "[SCAN] Overlapping current physical lattice coordinates...",
      ],
    }));

    await new Promise((r) => setTimeout(r, 500));
    setVerificationLogs((prev) => ({
      ...prev,
      [badgeId]: [
        ...(prev[badgeId] || []),
        "[DECRYPT] Reading encrypted custom security chip payload...",
        "[DECRYPT] Verifying matching identity references...",
      ],
    }));

    await new Promise((r) => setTimeout(r, 600));
    setVerificationLogs((prev) => ({
      ...prev,
      [badgeId]: [
        ...(prev[badgeId] || []),
        "[AUTH] Handshaking securely with ICDD signature directory...",
        "[AUTH] Generating real-time SHA-256 certificate validation hash...",
      ],
    }));

    await new Promise((r) => setTimeout(r, 500));
    setVerifiedBadges((prev) => ({ ...prev, [badgeId]: "verified" }));
    setVerificationLogs((prev) => ({
      ...prev,
      [badgeId]: [
        ...(prev[badgeId] || []),
        "[OK] VERIFIED POSITIVE - CLEARANCE PROTOCOLS STATUS: FULLY GRANTED",
      ],
    }));
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth(); // 297 mm
      const height = doc.internal.pageSize.getHeight(); // 210 mm

      // Inner borders
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(1.5);
      doc.rect(8, 8, width - 16, height - 16);

      doc.setDrawColor(196, 154, 108);
      doc.setLineWidth(0.5);
      doc.rect(11, 11, width - 22, height - 22);

      // Border corner crosses
      const cs = 4;
      doc.setDrawColor(196, 154, 108);
      doc.setLineWidth(1);
      doc.line(11, 11 + cs, 11 + cs, 11);
      doc.line(width - 11, 11 + cs, width - 11 - cs, 11);
      doc.line(11, height - 11 - cs, 11 + cs, height - 11);
      doc.line(width - 11, height - 11 - cs, width - 11 - cs, height - 11);

      // Text elements
      doc.setTextColor(79, 70, 229);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("UNIVERSAL CRYSTALLOGRAPHIC COMMISSION", width / 2, 28, {
        align: "center",
      });

      doc.setTextColor(30, 41, 59);
      doc.setFont("Times", "italic");
      doc.setFontSize(28);
      doc.text("Certificate of Analytical Eminence", width / 2, 45, {
        align: "center",
      });

      doc.setDrawColor(196, 154, 108);
      doc.setLineWidth(0.75);
      doc.line(width / 2 - 40, 52, width / 2 + 40, 52);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.text("THIS DECREE CONFIRMS THE DIGNITY AND TITLE OF", width / 2, 65, {
        align: "center",
      });

      doc.setTextColor(15, 23, 42);
      doc.setFont("Times", "bolditalic");
      doc.setFontSize(36);
      doc.text(`${profile.firstName} ${profile.lastName}`, width / 2, 85, {
        align: "center",
      });

      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(1.5);
      doc.line(width / 2 - 60, 92, width / 2 + 60, 92);

      doc.setTextColor(100, 116, 139);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10.5);
      const dec = `RECOGNIZED INTERNATIONALLY AS A PREEMINENT LABORATORY DIRECTOR, EXPERT IN THE COMPOSITION OF SOLID-STATE MATTER AND DIFFRACTION PHASES, DEMONSTRATING EXTRAORDINARY CAPABILITIES IN AUTOMATED AND FULL-PROFILE MATHEMATICAL REFINEMENTS.`;
      const splitDec = doc.splitTextToSize(dec, width - 80);
      doc.text(splitDec, width / 2, 105, {
        align: "center",
        lineHeightFactor: 1.4,
      });

      // Info Footer
      doc.setTextColor(71, 85, 105);
      doc.setFont("Courier", "bold");
      doc.setFontSize(9.5);
      doc.text(`ID REFERENCE: ${profile.idReference}`, 40, 142);
      doc.text(`CLASSIFICATION: ${profile.classification}`, 40, 148);
      doc.text(`CLEARANCE DECREE: LEVEL L-5 SUPERIOR`, 40, 154);

      // Impact indices panel
      doc.rect(width - 130, 135, 90, 24);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("VERIFIED LAB RECORD INDEX", width - 125, 140);
      doc.setFont("Courier", "bold");
      doc.setFontSize(8);
      doc.text(`H-INDEX METRIC: ${profile.stats.hIndex}`, width - 125, 146);
      doc.text(`CITATION INDEX: ${profile.stats.citations}`, width - 125, 151);
      doc.text(
        `SCANS COMPILED : ${profile.stats.scansAnalyzed}`,
        width - 125,
        156,
      );

      // Signs
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.5);
      doc.line(40, 182, 110, 182);
      doc.setFont("Times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text("International XRD Board Representative", 75, 188, {
        align: "center",
      });

      // Seal
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(1);
      doc.circle(width / 2, 180, 10);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(79, 70, 229);
      doc.text("SECURE SEAL", width / 2, 178, { align: "center" });
      doc.text("L-5 APPROVED", width / 2, 183, { align: "center" });

      doc.line(width - 110, 182, width - 40, 182);
      doc.setFont("Times", "italic");
      doc.setFontSize(11);
      doc.text("Crystallography Commission Secretary", width - 75, 188, {
        align: "center",
      });

      doc.save(`UCC_Certificate_${profile.firstName}_${profile.lastName}.pdf`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Load standard database configurations
  const [profileDbConfigs, setProfileDbConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem("xrd_database_configs");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      ICDD: {
        enabled: true,
        version: "PDF-4+ 2026",
        key: "ICDD-AZ92-U81",
        path: "/usr/share/ref/icdd/",
        priority: "High",
      },
      COD: {
        enabled: true,
        version: "COD Release 2025",
        key: "OPEN-ACCESS-FREE",
        path: "/var/db/cod/",
        priority: "High",
      },
      RRUFF: {
        enabled: true,
        version: "RRUFF Core 2024",
        key: "RRUFF-GEOLOGY-R1",
        path: "/opt/rruff/",
        priority: "Medium",
      },
      ICSD: {
        enabled: true,
        version: "ICSD 4.1.0",
        key: "ICSD-LIC-8821",
        path: "/usr/local/db/icsd/",
        priority: "Medium",
      },
      CSD: {
        enabled: true,
        version: "CSD Release 2025",
        key: "CSD-ORG-LIC-90",
        path: "/usr/local/db/csd/",
        priority: "Low",
      },
    };
  });

  useEffect(() => {
    // Sync from settings whenever profile page is shown or storage is updated
    const handleStorageChange = () => {
      try {
        const saved = localStorage.getItem("xrd_database_configs");
        if (saved) setProfileDbConfigs(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", handleStorageChange);
    handleStorageChange();
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [activeTab]);

  // Save profile state helper
  const saveProfileData = (newProfile: ProfileData) => {
    setProfile(newProfile);
    localStorage.setItem(
      "lab_director_profile_payload",
      JSON.stringify(newProfile),
    );
  };

  // Preset changer
  const handlePresetSelect = (presetKey: string) => {
    if (PRESETS[presetKey]) {
      const selected = PRESETS[presetKey];
      saveProfileData(selected);
      // Reset avatar if custom profile is swapped to let presets show default colors or loaded custom
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfileImage(base64);
        localStorage.setItem("lab_director_custom_avatar", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearProfileImage = () => {
    setProfileImage(null);
    localStorage.removeItem("lab_director_custom_avatar");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Editors utilities
  const handleSkillChange = (index: number, level: number) => {
    const updatedSkills = [...profile.skills];
    updatedSkills[index] = { ...updatedSkills[index], level };
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const handleSkillNameChange = (index: number, name: string) => {
    const updatedSkills = [...profile.skills];
    updatedSkills[index] = { ...updatedSkills[index], name };
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const addNewSkill = () => {
    const updatedSkills = [
      ...profile.skills,
      { name: "New Material Science Skill", level: 80 },
    ];
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  const deleteSkill = (index: number) => {
    const updatedSkills = profile.skills.filter((_, i) => i !== index);
    saveProfileData({ ...profile, skills: updatedSkills });
  };

  // Research Project helpers
  const handleResearchChange = (index: number, field: string, value: any) => {
    const updatedResearch = [...profile.research];
    updatedResearch[index] = { ...updatedResearch[index], [field]: value };
    saveProfileData({ ...profile, research: updatedResearch });
  };

  const addNewResearch = () => {
    const updated: Research[] = [
      ...profile.research,
      {
        title: "Structural Quantum Phase Probe",
        status: "In Planning",
        progress: 10,
        color: "cyan",
      },
    ];
    saveProfileData({ ...profile, research: updated });
  };

  const deleteResearch = (index: number) => {
    const updated = profile.research.filter((_, i) => i !== index);
    saveProfileData({ ...profile, research: updated });
  };

  // Publication helpers
  const handlePubChange = (index: number, field: string, value: string) => {
    const updated = [...profile.publications];
    updated[index] = { ...updated[index], [field]: value };
    saveProfileData({ ...profile, publications: updated });
  };

  const addNewPub = () => {
    const updated = [
      ...profile.publications,
      {
        title: "High-Performance Rietveld refinements on multicrystal systems",
        journal: "Acta Materialia",
        date: "2026",
      },
    ];
    saveProfileData({ ...profile, publications: updated });
  };

  const deletePub = (index: number) => {
    const updated = profile.publications.filter((_, i) => i !== index);
    saveProfileData({ ...profile, publications: updated });
  };

  // Archive milestones helpers
  const handleArchiveChange = (index: number, field: string, value: string) => {
    const updated = [...profile.archive];
    updated[index] = { ...updated[index], [field]: value };
    saveProfileData({ ...profile, archive: updated });
  };

  const addNewMilestone = () => {
    const updated = [
      ...profile.archive,
      {
        year: "2026",
        title: "Advanced Lattice Synch Integration",
        desc: "Seamless integration with international synchrotron databases.",
      },
    ];
    saveProfileData({ ...profile, archive: updated });
  };

  const deleteMilestone = (index: number) => {
    const updated = profile.archive.filter((_, i) => i !== index);
    saveProfileData({ ...profile, archive: updated });
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Mail":
        return Mail;
      case "Linkedin":
        return Linkedin;
      case "Github":
        return Github;
      default:
        return Globe;
    }
  };

  // Preset colors for reactor avatar background fallback
  const getPresetGlow = () => {
    if (profile.firstName === "Ali")
      return "from-indigo-600/30 to-fuchsia-600/10";
    if (profile.firstName === "Elizabeth")
      return "from-cyan-650/40 to-blue-500/10";
    return "from-amber-600/30 to-orange-500/10";
  };

  const getPresetPrimaryColor = () => {
    if (profile.firstName === "Ali") return "text-indigo-500";
    if (profile.firstName === "Elizabeth") return "text-cyan-500";
    return "text-amber-500";
  };

  const getPresetBadgeBorder = () => {
    if (profile.firstName === "Ali")
      return "border-indigo-500/20 bg-indigo-505/10 text-indigo-500";
    if (profile.firstName === "Elizabeth")
      return "border-cyan-500/20 bg-cyan-505/10 text-cyan-500";
    return "border-amber-500/20 bg-amber-505/10 text-amber-500";
  };

  return (
    <div className="min-h-screen animate-in fade-in duration-700 p-4 lg:p-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      {/* Decorative Blueprint Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-indigo-500/20 rounded-full animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10 space-y-10">
        {/* Lab Director Navigation Bar */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm z-50 sticky top-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-650/40">
              {profile.firstName[0]}
            </div>
            <div>
              <p className="text-xs font-black uppercase text-slate-400 tracking-widest leading-none">
                Crystallography Station
              </p>
              <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight mt-1">
                {profile.firstName} {profile.lastName} Dpt
              </h2>
            </div>
          </div>

          {/* Module Tabs */}
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
            {(["dossier", "configurator", "credentials"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md"
                      : "text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {tab === "dossier" && <User size={13} />}
                  {tab === "configurator" && <Sliders size={13} />}
                  {tab === "credentials" && <Award size={13} />}
                  <span>
                    {tab === "dossier" && "Dossier Overview"}
                    {tab === "configurator" && "Customize Profile"}
                    {tab === "credentials" && "Clearances & Badges"}
                  </span>
                </button>
              ),
            )}
          </div>
        </div>

        {/* Dynamic Inner Dashboard */}
        <AnimatePresence mode="wait">
          {activeTab === "dossier" && (
            <motion.div
              key="dossier"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-12"
            >
              {/* Dossier Header Area */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* ID badge card */}
                <div className="lg:col-span-4 space-y-8">
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-25 transition-opacity duration-700" />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200/50 dark:border-slate-800/50 p-3 overflow-hidden shadow-lg">
                      <div className="aspect-square rounded-[2.5rem] bg-slate-50 dark:bg-slate-950 flex items-center justify-center relative overflow-hidden border border-slate-200 dark:border-slate-800 group">
                        <div
                          className={`absolute inset-0 bg-gradient-to-tr ${getPresetGlow()}`}
                        />

                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Director identity"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex flex-col items-center">
                            <div className="w-48 h-48 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-full flex items-center justify-center relative mb-4 shadow-lg">
                              <div className="w-40 h-40 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-indigo-500/20 flex items-center justify-center p-8">
                                <User className="w-16 h-16 text-slate-400 group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <div className="absolute inset-0 border-2 border-indigo-500/10 rounded-full animate-spin-slow" />
                            </div>
                            <span className="text-2xl font-bold text-slate-300 dark:text-white/25 select-none tracking-tight uppercase font-sans">
                              {profile.firstName[0]}
                              {profile.lastName[0]} MODEL
                            </span>
                          </div>
                        )}

                        <div
                          onClick={triggerFileInput}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm z-25"
                        >
                          <Camera className="w-10 h-10 text-white mb-2 animate-bounce" />
                          <span className="text-white text-xs font-black uppercase tracking-[0.3em]">
                            Upload Photo File
                          </span>
                          {profileImage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                clearProfileImage();
                              }}
                              className="mt-3 px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-black hover:bg-rose-500"
                            >
                              Remove Photo
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                    </div>
                  </div>

                  {/* Operational security metrics card */}
                  <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-[2.5rem] border border-slate-200/50 dark:border-slate-800/50 p-8 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl">
                        <ShieldCheck className="w-5 h-5 text-indigo-500" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 font-sans">
                        Lab Security Credentials
                      </h3>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500">
                          Classification
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-full border ${getPresetBadgeBorder()}`}
                        >
                          {profile.classification}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-500">
                          ID Reference
                        </span>
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 font-bold">
                          {profile.idReference}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">
                          Node Status
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-emerald-550 rounded-full animate-pulse" />
                          <span className="text-xs font-black text-indigo-500 uppercase tracking-widest">
                            {profile.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High Quality Barcode Badge Decal */}
                  <div className="p-6 bg-slate-900 rounded-[2rem] border border-slate-800 flex flex-col justify-between h-40 font-mono text-slate-400 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Code className="w-32 h-32" />
                    </div>
                    <div>
                      <p className="text-xs font-black tracking-widest uppercase text-indigo-400">
                        Access Card
                      </p>
                      <p className="text-xs font-bold text-white mt-1">
                        IDENTITY VERIFIED
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex gap-0.5 h-10 items-end justify-between bg-white/5 p-1 rounded-md">
                        {[
                          1, 4, 2, 7, 1, 3, 9, 1, 2, 5, 8, 3, 1, 6, 2, 4, 8, 3,
                          1, 5, 2, 9, 6, 1, 4, 2, 7, 3, 8, 2, 1,
                        ].map((wt, i) => (
                          <div
                            key={i}
                            style={{
                              width: `${wt === 1 ? "1px" : wt === 2 ? "2px" : "3px"}`,
                            }}
                            className="bg-slate-300 h-full inline-block"
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs font-normal tracking-[0.2em] font-mono">
                        <span>VALID ID</span>
                        <span>{profile.idReference}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Director Core Bio */}
                <div className="lg:col-span-8 space-y-10">
                  <div className="space-y-4 lg:space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-px w-12 bg-indigo-500/30" />
                      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
                        Crystallography Architect
                      </span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-none font-sans break-words">
                      {profile.firstName} <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-tr from-indigo-600 via-indigo-450 to-cyan-400">
                        {profile.lastName}
                      </span>
                    </h1>
                    <p className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 font-bold max-w-2xl leading-tight">
                      {profile.subDescription}
                    </p>
                  </div>

                  {/* Grid of Dynamic counters / Science Metrics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "h-index metric",
                        val: profile.stats.hIndex,
                        desc: "Academic H-Index",
                      },
                      {
                        label: "total citations",
                        val: profile.stats.citations,
                        desc: "Scopus/Nature citation records",
                      },
                      {
                        label: "peer reports",
                        val: profile.stats.peerReviews,
                        desc: "Approved journal reviews",
                      },
                      {
                        label: "xrd scans fit",
                        val: profile.stats.scansAnalyzed,
                        desc: "Dataset calculations completed",
                      },
                    ].map((st, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden group"
                      >
                        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-455 scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
                        <span className="block text-xs font-black uppercase text-slate-400 tracking-widest mb-1">
                          {st.label}
                        </span>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight leading-none my-1">
                          {st.val.toLocaleString()}
                        </h3>
                        <p className="text-xs text-slate-455 font-bold mt-1.5 leading-tight">
                          {st.desc}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Analytical Performance Tracking Trend Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm space-y-6 relative overflow-hidden group mb-8">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full pointer-events-none" />
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-500/10 rounded-xl animate-pulse">
                          <Activity className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                            Analytical Output & Citation Performance
                          </h4>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Historical Scopus/Nature diffraction citation &
                            index trends
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-indigo-500/5 dark:bg-indigo-550/10 border border-indigo-550/20 rounded-md text-xs font-mono font-bold text-indigo-500">
                        ACTIVE NODE: UCC-{profile.firstName.toUpperCase()}
                        -VERIFIED
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={getTrendData(profile.firstName)}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorCitations"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6366f1"
                                stopOpacity={0.2}
                              />
                              <stop
                                offset="95%"
                                stopColor="#6366f1"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f1f5f9"
                            className="dark:hidden"
                          />
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e293b"
                            className="hidden dark:block"
                          />
                          <XAxis
                            dataKey="year"
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="JetBrains Mono"
                          />
                          <YAxis
                            stroke="#94a3b8"
                            fontSize={10}
                            fontFamily="JetBrains Mono"
                          />
                          <ChartTooltip
                            contentStyle={{
                              backgroundColor: "rgba(15, 23, 42, 0.9)",
                              borderColor: "#6366f1",
                              borderRadius: "1rem",
                              padding: "0.75rem",
                              color: "#fff",
                            }}
                            labelStyle={{
                              fontFamily: "JetBrains Mono",
                              fontSize: "10px",
                              color: "#6366f1",
                              fontWeight: "bold",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="citations"
                            name="Total Citations"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorCitations)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Skills list cards */}
                    <div className="group p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-sm space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-500/10 rounded-2xl">
                          <Layers className="w-5 h-5 text-amber-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">
                          Specialized Disciplines
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {profile.skills.map((skill, index) => (
                          <div key={index} className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                              <span className="text-xs font-black uppercase tracking-widest text-slate-500">
                                {skill.name}
                              </span>
                              <span className="text-xs font-mono font-bold text-indigo-500">
                                {skill.level}%
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${skill.level}%` }}
                                transition={{
                                  duration: 1.2,
                                  delay: 0.1 * index,
                                }}
                                className={`h-full ${index % 2 === 0 ? "bg-indigo-500" : "bg-cyan-500"}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-8">
                      {/* Active Research card */}
                      <div className="group p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 hover:border-emerald-500/30 transition-all shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <Activity className="w-5 h-5 text-emerald-500" />
                          </div>
                          <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">
                            Research Milestones
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {profile.research.map((item, i) => (
                            <div
                              key={i}
                              className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">
                                  {item.title}
                                </span>
                                <span className="text-xs font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-500/10 rounded-full">
                                  {item.status}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    className="h-full bg-indigo-500"
                                  />
                                </div>
                                <div className="flex justify-between text-xs font-mono text-slate-400">
                                  <span>CONVERGENCE</span>
                                  <span>{item.progress}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Mission Quote */}
                      <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform">
                          <Target className="w-32 h-32" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest mb-4 opacity-75">
                          Lab Mission
                        </h3>
                        <p className="text-lg font-bold leading-relaxed relative z-10 italic">
                          "{profile.mission}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Grid of details contact and secure links */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Secure Links info */}
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-500/10 rounded-2xl">
                          <Globe className="w-5 h-5 text-sky-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">
                          Contact & Links
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {profile.links.map((link, i) => {
                          const LinkIcon = getIconComponent(link.icon);
                          return (
                            <a
                              key={i}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-4 group/link"
                            >
                              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl group-hover/link:bg-indigo-500/10 transition-colors">
                                <LinkIcon className="w-4 h-4 text-slate-450 group-hover/link:text-indigo-500" />
                              </div>
                              <div className="flex-1">
                                <span className="block text-xs font-black uppercase text-slate-400 tracking-widest">
                                  {link.label}
                                </span>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover/link:text-indigo-500 transition-colors uppercase italic font-serif tracking-tight">
                                  {link.val}
                                </span>
                              </div>
                              <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover/link:opacity-100 transition-all -translate-x-2 group-hover/link:translate-x-0" />
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Publications block list */}
                    <div className="p-8 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                          <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white font-sans">
                          Recent Journal Publications
                        </h3>
                      </div>
                      <div className="space-y-4">
                        {profile.publications.slice(0, 3).map((pub, i) => (
                          <div
                            key={i}
                            className="group/pub cursor-pointer border-l-2 border-indigo-650 pl-3 py-0.5 whitespace-normal"
                          >
                            <span className="block text-xs font-black text-indigo-500 uppercase tracking-widest mb-1">
                              {pub.journal} • {pub.date}
                            </span>
                            <p className="text-xs font-extrabold text-slate-700 dark:text-slate-300 group-hover/pub:text-indigo-500 transition-colors uppercase tracking-tight leading-normal">
                              {pub.title}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Standard Reference Database Sync Monitor - Developed into Global Database Sync Portal */}
              <div className="p-8 md:p-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[3rem] shadow-sm space-y-8 mt-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-150 dark:border-white/5">
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-2xl border border-indigo-500/20 animate-pulse">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-wider text-slate-900 dark:text-white font-sans">
                        Global Database Sync Portal
                      </h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Multi-region crystallographic index hubs with synchronized quantum state-mapping
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center" id="verify-latency-container">
                    <button
                      onClick={handlePingDatabases}
                      disabled={isPinging}
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-550 hover:to-indigo-650 border border-indigo-500/30 text-white rounded-xl transition-all cursor-pointer font-black font-sans uppercase flex items-center gap-2 shadow-lg shadow-indigo-650/20 disabled:opacity-50"
                    >
                      {isPinging ? (
                        <Loader2 size={12} className="animate-spin text-white" />
                      ) : (
                        <RefreshCw size={12} className="text-white" />
                      )}
                      <span>
                        {isPinging ? "Synchronizing Hubs..." : "Initialize Network Sync"}
                      </span>
                    </button>
                    
                    <div className="px-4 py-2.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl font-mono text-xs font-black flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      CONVERGENCE: ACTIVE
                    </div>
                  </div>
                </div>

                {/* Main Content Area: Map and Database Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Side: Topology Map */}
                  <div className="lg:col-span-5 flex flex-col items-center bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-150 dark:border-white/5 relative overflow-hidden shadow-xs">
                    <div className="absolute top-2 left-4 flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      Live Network Topology
                    </div>

                    <div className="w-full max-w-[280px] h-[280px] relative mt-4">
                      {/* Interactive SVG Radar Map */}
                      <svg viewBox="0 0 300 300" className="w-full h-full">
                        {/* Radar grids */}
                        <circle cx="150" cy="150" r="130" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900" />
                        <circle cx="150" cy="150" r="90" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900" strokeDasharray="4,4" />
                        <circle cx="150" cy="150" r="50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900" />
                        <line x1="20" y1="150" x2="280" y2="150" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900" />
                        <line x1="150" y1="20" x2="150" y2="280" stroke="currentColor" strokeWidth="0.5" className="text-slate-100 dark:text-slate-900" />

                        {/* Connection Curves with Animated Pulse Packets */}
                        {[
                          { key: "ICDD", x: 212, y: 65 },
                          { key: "COD", x: 85, y: 61 },
                          { key: "RRUFF", x: 55, y: 181 },
                          { key: "ICSD", x: 150, y: 245 },
                          { key: "CSD", x: 250, y: 182 },
                        ].map((node) => {
                          const isEnabled = profileDbConfigs[node.key as any]?.enabled;
                          const isSelected = selectedDb === node.key;
                          // Curve to center (150,150)
                          const pathD = `M 150 150 Q ${150 + (node.x - 150) * 0.3} ${150 + (node.y - 150) * 0.7} ${node.x} ${node.y}`;
                          return (
                            <g key={node.key}>
                              <path
                                d={pathD}
                                fill="none"
                                stroke={isSelected ? "#6366f1" : isEnabled ? "#10b981" : "#ef4444"}
                                strokeWidth={isSelected ? "2" : "1"}
                                strokeOpacity={isSelected ? "1" : "0.35"}
                                strokeDasharray="3,3"
                              />
                              {isEnabled && (
                                <circle r="4" fill="#6366f1">
                                  <animateMotion
                                    dur={`${1.5 + Math.random() * 2}s`}
                                    repeatCount="indefinite"
                                    path={pathD}
                                  />
                                </circle>
                              )}
                            </g>
                          );
                        })}

                        {/* Central Hub Node (Local Workspace) */}
                        <g transform="translate(150,150)">
                          <circle r="12" className="fill-indigo-500/10 stroke-indigo-500 stroke-1" />
                          <circle r="5" className="fill-indigo-500" />
                          <circle r="16" className="fill-none stroke-indigo-500/30 stroke-1 animate-ping" />
                        </g>

                        {/* Satellite Nodes mapping */}
                        {[
                          { key: "ICDD", x: 212, y: 65, label: "ICDD (US-EAST)" },
                          { key: "COD", x: 85, y: 61, label: "COD (EU-WEST)" },
                          { key: "RRUFF", x: 55, y: 181, label: "RRUFF (US-WEST)" },
                          { key: "ICSD", x: 150, y: 245, label: "ICSD (EU-CENTRAL)" },
                          { key: "CSD", x: 250, y: 182, label: "CSD (EU-NORTH)" },
                        ].map((node) => {
                          const isEnabled = profileDbConfigs[node.key as any]?.enabled;
                          const isSelected = selectedDb === node.key;
                          return (
                            <g
                              key={node.key}
                              transform={`translate(${node.x},${node.y})`}
                              className="cursor-pointer group"
                              onClick={() => {
                                setSelectedDb(node.key as any);
                                setSelectedCompound(null);
                              }}
                            >
                              <circle
                                r={isSelected ? "12" : "8"}
                                className={`transition-all duration-300 ${
                                  isSelected 
                                    ? "fill-indigo-500/20 stroke-indigo-500 stroke-2" 
                                    : isEnabled 
                                      ? "fill-emerald-500/10 stroke-emerald-500 stroke-1 group-hover:fill-emerald-500/20" 
                                      : "fill-rose-500/10 stroke-rose-500 stroke-1"
                                }`}
                              />
                              <circle
                                r="4"
                                className={isEnabled ? "fill-emerald-500" : "fill-rose-500"}
                              />
                              {isSelected && (
                                <circle r="18" className="fill-none stroke-indigo-500/40 stroke-1 animate-pulse" />
                              )}
                              
                              <text
                                y="-15"
                                textAnchor="middle"
                                className="text-[8px] font-black tracking-wider fill-slate-700 dark:fill-slate-300 uppercase font-sans pointer-events-none"
                              >
                                {node.key}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>

                    <div className="mt-4 flex gap-4 text-[9px] font-black uppercase tracking-wider text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        <span>LOCAL HUB</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>ONLINE NODE</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>MUTED NODE</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Grid of Cards */}
                  <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-5 lg:grid-cols-2 gap-4">
                    {(["ICDD", "COD", "RRUFF", "ICSD", "CSD"] as const).map((dbKey) => {
                      const item = profileDbConfigs[dbKey];
                      const isSelected = selectedDb === dbKey;

                      const colorClass =
                        dbKey === "ICDD"
                          ? "text-amber-500 border-amber-500/15 bg-amber-500/5"
                          : dbKey === "COD"
                            ? "text-emerald-500 border-emerald-500/15 bg-emerald-500/5"
                            : dbKey === "RRUFF"
                              ? "text-cyan-500 border-cyan-500/15 bg-cyan-500/5"
                              : dbKey === "ICSD"
                                ? "text-indigo-400 border-indigo-500/15 bg-indigo-500/5"
                                : "text-rose-500 border-rose-500/15 bg-rose-500/5";

                      const recCount =
                        dbKey === "ICDD"
                          ? "485,280 Peaks"
                          : dbKey === "COD"
                            ? "512,940 Cells"
                            : dbKey === "RRUFF"
                              ? "32,410 Raman"
                              : dbKey === "ICSD"
                                ? "239,180 Inorg"
                                : "1,250,910 Organic";

                      return (
                        <div
                          key={dbKey}
                          onClick={() => {
                            setSelectedDb(dbKey);
                            setSelectedCompound(null);
                          }}
                          className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                            isSelected
                              ? "bg-indigo-500/5 border-indigo-500/40 shadow-md shadow-indigo-500/5 dark:bg-slate-950"
                              : "bg-white dark:bg-slate-950 border-slate-150 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-black tracking-widest px-2.5 py-1 rounded-lg border uppercase ${colorClass}`}>
                                {dbKey}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.enabled ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  {item.enabled ? "ONLINE" : "MUTED"}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Catalog Version
                              </div>
                              <div className="text-xs font-mono font-extrabold text-slate-700 dark:text-slate-200 uppercase truncate">
                                {item.version}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-white/5 mt-4">
                            <div className="grid grid-cols-2 gap-2 text-[10px] font-sans font-black uppercase text-slate-400 leading-tight">
                              <div>
                                <div className="text-slate-400">INDEXED</div>
                                <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                                  {recCount}
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400">PRIORITY</div>
                                <div className="text-xs font-black font-mono text-slate-800 dark:text-slate-200 mt-0.5">
                                  {item.priority}
                                </div>
                              </div>
                            </div>

                            {dbLatencies[dbKey] ? (
                              <div className="space-y-1 pt-1.5 border-t border-dashed border-slate-200 dark:border-slate-800">
                                <span className="block text-[8px] font-black text-indigo-400 uppercase tracking-wider">
                                  LATENCY RESPONSE:
                                </span>
                                <span className="block text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 py-1 px-2 rounded-lg text-center">
                                  ⚡ {dbLatencies[dbKey]}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold text-slate-400 italic">
                                Sync required
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>

                {/* Interactive Registry Inspector Component */}
                <AnimatePresence mode="wait">
                  {selectedDb && (
                    <motion.div
                      key={selectedDb}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-3xl space-y-6 shadow-sm"
                    >
                      {/* Sub-header of Selected DB */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <Server className="w-5 h-5 text-indigo-500" />
                          <div>
                            <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-widest font-sans">
                              Active Node: {selectedDb} Registry Inspector
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              Endpoint: {profileDbConfigs[selectedDb].path} • Security Cipher: AES-256-GCM / SHA-256
                            </p>
                          </div>
                        </div>

                        {/* Interactive Node Controls */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Priority:</span>
                            <select
                              value={profileDbConfigs[selectedDb].priority}
                              onChange={(e) => {
                                const val = e.target.value;
                                const updated = {
                                  ...profileDbConfigs,
                                  [selectedDb]: { ...profileDbConfigs[selectedDb], priority: val }
                                };
                                setProfileDbConfigs(updated);
                                localStorage.setItem("xrd_database_configs", JSON.stringify(updated));
                              }}
                              className="text-xs font-black font-mono bg-transparent text-slate-800 dark:text-slate-200 border-none outline-none cursor-pointer uppercase"
                            >
                              <option value="High">High</option>
                              <option value="Medium">Medium</option>
                              <option value="Low">Low</option>
                            </select>
                          </div>

                          <button
                            onClick={() => {
                              const updated = {
                                ...profileDbConfigs,
                                [selectedDb]: { ...profileDbConfigs[selectedDb], enabled: !profileDbConfigs[selectedDb].enabled }
                              };
                              setProfileDbConfigs(updated);
                              localStorage.setItem("xrd_database_configs", JSON.stringify(updated));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                              profileDbConfigs[selectedDb].enabled
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20"
                                : "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20"
                            }`}
                          >
                            {profileDbConfigs[selectedDb].enabled ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                            <span>{profileDbConfigs[selectedDb].enabled ? "ONLINE" : "MUTED"}</span>
                          </button>
                        </div>
                      </div>

                      {/* Detail Column Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* 1. Compound Search Catalogue Column */}
                        <div className="lg:col-span-4 space-y-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                            <span>Search Crystallographic Phases</span>
                            <span className="font-mono text-indigo-500">{MOCK_DATABASE_CATALOGS[selectedDb]?.length || 0} files</span>
                          </div>

                          <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                            <input
                              type="text"
                              value={dbSearchQuery}
                              onChange={(e) => setDbSearchQuery(e.target.value)}
                              placeholder={`Query index catalog (e.g. TiO2, Quartz)...`}
                              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-850 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-indigo-500/50"
                            />
                          </div>

                          {/* Phase Catalog List */}
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                            {(MOCK_DATABASE_CATALOGS[selectedDb] || [])
                              .filter((item) => {
                                const q = dbSearchQuery.toLowerCase();
                                return (
                                  item.name.toLowerCase().includes(q) ||
                                  item.formula.toLowerCase().includes(q) ||
                                  item.crystalSystem.toLowerCase().includes(q) ||
                                  item.spaceGroup.toLowerCase().includes(q)
                                );
                              })
                              .map((compound) => {
                                const isCompoundSelected = selectedCompound?.id === compound.id;
                                return (
                                  <div
                                    key={compound.id}
                                    onClick={() => setSelectedCompound(compound)}
                                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                                      isCompoundSelected
                                        ? "bg-indigo-500/10 border-indigo-500/30 dark:bg-indigo-950/20"
                                        : "bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/40 dark:hover:bg-slate-900 border-slate-150 dark:border-white/5"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <div>
                                        <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                          {compound.name} ({compound.formula})
                                        </h5>
                                        <span className="text-[9px] font-black font-mono text-slate-400 tracking-wider">
                                          {compound.id}
                                        </span>
                                      </div>
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                    <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] font-sans font-bold uppercase text-slate-450 dark:text-slate-400">
                                      <div>SYS: {compound.crystalSystem}</div>
                                      <div>SG: {compound.spaceGroup.split(" ")[0]}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            
                            {(MOCK_DATABASE_CATALOGS[selectedDb] || []).filter((item) => {
                              const q = dbSearchQuery.toLowerCase();
                              return (
                                item.name.toLowerCase().includes(q) ||
                                item.formula.toLowerCase().includes(q) ||
                                item.crystalSystem.toLowerCase().includes(q) ||
                                item.spaceGroup.toLowerCase().includes(q)
                              );
                            }).length === 0 && (
                              <div className="p-4 bg-slate-50 dark:bg-slate-900/40 text-center rounded-xl border border-dashed border-slate-200 dark:border-white/5 text-[10px] font-bold text-slate-400">
                                No crystallographic index matches the active query
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 2. Compound Details & Live Peak Diffraction Chart Column */}
                        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-150 dark:border-white/5">
                          {selectedCompound ? (
                            <div className="space-y-4 h-full flex flex-col justify-between">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight font-sans">
                                    {selectedCompound.name} • Physical Profile
                                  </h5>
                                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-1">
                                    {selectedCompound.description}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 p-3 bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 rounded-xl font-mono text-[9px] font-black uppercase text-slate-500">
                                  <div>
                                    <span className="block text-[8px] text-slate-400">SPACE GROUP</span>
                                    <span className="text-slate-800 dark:text-slate-200">{selectedCompound.spaceGroup}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[8px] text-slate-400">CALC DENSITY</span>
                                    <span className="text-slate-800 dark:text-slate-200">{selectedCompound.density}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="block text-[8px] text-slate-400">LATTICE PARAMETERS</span>
                                    <span className="text-slate-800 dark:text-slate-200 text-[8.5px]">{selectedCompound.cellParams}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Recharts Continuous Powder Scan Diffraction Preview */}
                              <div className="space-y-1.5 pt-2">
                                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                  Simulated Bragg Powder Scan diffractogram (FWHM 0.5° FWHM Lorentzian Profile)
                                </span>
                                <div className="h-[140px] w-full bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-white/5 p-2 relative">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                      data={generateDiffractionSpectrum(selectedCompound.peaks)}
                                      margin={{ top: 10, right: 10, left: -25, bottom: -10 }}
                                    >
                                      <defs>
                                        <linearGradient id="diffGrad" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:hidden" />
                                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" className="hidden dark:block" />
                                      <XAxis dataKey="twoTheta" stroke="#94a3b8" fontSize={8} tickLine={false} />
                                      <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} />
                                      <ChartTooltip
                                        content={({ active, payload }) => {
                                          if (active && payload && payload.length) {
                                            return (
                                              <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[9px] font-mono text-white space-y-0.5">
                                                <div>2-Theta: {payload[0].payload.twoTheta}°</div>
                                                <div>Intensity: {payload[0].value} counts</div>
                                              </div>
                                            );
                                          }
                                          return null;
                                        }}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="intensity"
                                        stroke="#6366f1"
                                        strokeWidth={1.5}
                                        fillOpacity={1}
                                        fill="url(#diffGrad)"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>

                                  {/* Peaks Markers Overlays */}
                                  <div className="absolute top-2.5 right-4 flex gap-2 font-mono text-[8px] font-black text-indigo-500 uppercase">
                                    {selectedCompound.peaks.slice(0, 3).map((p, idx) => (
                                      <span key={idx} className="bg-indigo-500/5 px-1.5 py-0.5 rounded border border-indigo-500/10">
                                        ({p.hkl}) {p.twoTheta}° [{p.intensity}%]
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center py-10 text-center space-y-3">
                              <div className="p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 text-slate-400 rounded-2xl">
                                <Microscope className="w-6 h-6" />
                              </div>
                              <div>
                                <h6 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                  No compound selected
                                </h6>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                  Select a compound from the database list on the left to inspect its physical parameters
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Real-time Diagnostic Terminal Logs */}
                {syncConsoleLogs.length > 0 && (
                  <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span>SECURITY HANDSHAKE DIAGNOSTIC CONSOLE</span>
                      </div>
                      <button
                        onClick={() => setSyncConsoleLogs([])}
                        className="text-slate-500 hover:text-slate-300 transition-colors uppercase cursor-pointer"
                      >
                        [ Clear Logs ]
                      </button>
                    </div>

                    <div className="h-32 overflow-y-auto text-[9.5px] font-mono leading-relaxed text-emerald-400 space-y-1.5 pr-2 custom-scrollbar bg-slate-950 p-2.5 border border-slate-900 rounded-xl">
                      {syncConsoleLogs.map((log, index) => (
                        <div key={index} className="truncate">
                          {log}
                        </div>
                      ))}
                    </div>

                    {/* Progress Bar of active Sync */}
                    {isPinging && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8.5px] font-mono text-indigo-400 font-black">
                          <span>SYNCING PROGRESS: {syncStatus.toUpperCase()}</span>
                          <span>{syncProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <motion.div
                            className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full"
                            style={{ width: `${syncProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-[9.5px] leading-relaxed text-slate-500 text-center font-medium">
                  ℹ <strong>Database Security Verified:</strong> Standard Reference Databases are checked and authenticated by the Laboratory Director for the analysis pipeline. Configured priority states are preserved locally in the active session context.
                </div>
              </div>

              {/* Milestones / Archive section */}
              <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800 space-y-8">
                <div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-2 font-sans">
                    Director's Archive
                  </h2>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Scientific Milestones & High-Fidelity Breakthroughs
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {profile.archive.map((item, i) => (
                    <div
                      key={i}
                      className="relative p-8 lg:p-10 bg-white dark:bg-slate-900 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-md group"
                    >
                      <div className="absolute -top-3.5 left-10 px-4 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-full text-xs font-black italic text-indigo-500 font-mono shadow-xs">
                        {item.year}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter uppercase italic mt-1 font-sans">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ActiveTab 2: Configuration form & Archetypes */}
          {activeTab === "configurator" && (
            <motion.div
              key="configurator"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-250 dark:border-white/10 p-8 lg:p-12 shadow-2xl space-y-10"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-slate-100 dark:border-slate-800 pb-10">
                <div className="lg:col-span-4 space-y-3">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest rounded-full border border-indigo-500/20 font-mono">
                    Dossier Presets
                  </span>
                  <p className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                    Switch Lab Archetype
                  </p>
                  <p className="text-xs text-slate-400 font-bold leading-relaxed">
                    Selecting an archetype auto-refreshes all scientific
                    variables, h-indexes, citations, and milestone models.
                  </p>
                </div>
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      key: "ali",
                      name: "Ali Zerehsaz",
                      label: "Computing Lead",
                    },
                    {
                      key: "bragg",
                      name: "Elizabeth Bragg",
                      label: "Synchrotron Lead",
                    },
                    {
                      key: "rietveld",
                      name: "Joseph Rietveld",
                      label: "Mathematical Lead",
                    },
                  ].map((pres) => (
                    <button
                      key={pres.key}
                      onClick={() => handlePresetSelect(pres.key)}
                      className={`p-5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                        profile.idReference === PRESETS[pres.key].idReference
                          ? "border-indigo-650 bg-indigo-500/5 dark:bg-indigo-500/10"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 bg-transparent"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-mono text-indigo-505 dark:text-indigo-400 font-black tracking-wider uppercase">
                          {pres.label}
                        </p>
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 uppercase italic leading-none">
                          {pres.name}
                        </h4>
                      </div>
                      <span className="text-xs font-black text-slate-400 uppercase mt-4 block">
                        {PRESETS[pres.key].classification}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form editing container */}
              <div className="space-y-8">
                {/* 1. Core Metadata */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                    <User size={13} className="text-indigo-500" /> Identity
                    Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            firstName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            lastName: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Title
                      </label>
                      <input
                        type="text"
                        value={profile.title}
                        onChange={(e) =>
                          saveProfileData({ ...profile, title: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        ID Reference Code
                      </label>
                      <input
                        type="text"
                        value={profile.idReference}
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            idReference: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Sub-Description / Active Subtitle
                    </label>
                    <input
                      type="text"
                      value={profile.subDescription}
                      onChange={(e) =>
                        saveProfileData({
                          ...profile,
                          subDescription: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Mission Command Statement
                    </label>
                    <textarea
                      rows={2}
                      value={profile.mission}
                      onChange={(e) =>
                        saveProfileData({ ...profile, mission: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                </div>

                {/* 2. Core Stats Counters */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-850 pb-2">
                    <Activity size={13} className="text-indigo-500" />{" "}
                    Scientific Impact Statistics
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        H-Index
                      </label>
                      <input
                        type="number"
                        value={
                          String(profile.stats.hIndex) === "NaN"
                            ? ""
                            : profile.stats.hIndex
                        }
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            stats: {
                              ...profile.stats,
                              hIndex: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500 font-sans">
                        Total Citations
                      </label>
                      <input
                        type="number"
                        value={
                          String(profile.stats.citations) === "NaN"
                            ? ""
                            : profile.stats.citations
                        }
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            stats: {
                              ...profile.stats,
                              citations: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        Peer Reviews Verified
                      </label>
                      <input
                        type="number"
                        value={
                          String(profile.stats.peerReviews) === "NaN"
                            ? ""
                            : profile.stats.peerReviews
                        }
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            stats: {
                              ...profile.stats,
                              peerReviews: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-500">
                        XRD Datasets Analyzed
                      </label>
                      <input
                        type="number"
                        value={
                          String(profile.stats.scansAnalyzed) === "NaN"
                            ? ""
                            : profile.stats.scansAnalyzed
                        }
                        onChange={(e) =>
                          saveProfileData({
                            ...profile,
                            stats: {
                              ...profile.stats,
                              scansAnalyzed: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Skill Matrices Editor */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Layers size={13} className="text-indigo-500" />{" "}
                      Operational Disciplines Range
                    </h3>
                    <button
                      onClick={addNewSkill}
                      className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1"
                    >
                      <Plus size={10} /> Add Domain
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-4"
                      >
                        <div className="flex-1 space-y-1.5 w-full">
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) =>
                              handleSkillNameChange(index, e.target.value)
                            }
                            className="bg-transparent text-xs font-black uppercase text-slate-800 dark:text-slate-200 outline-none w-full border-b border-dotted border-slate-350 focus:border-indigo-500 pb-1"
                          />
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={
                                String(skill.level) === "NaN" ? "" : skill.level
                              }
                              onChange={(e) =>
                                handleSkillChange(
                                  index,
                                  parseInt(e.target.value),
                                )
                              }
                              className="flex-1 accent-indigo-600"
                            />
                            <span className="font-mono text-xs font-black text-indigo-500 w-8 text-right">
                              {skill.level}%
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSkill(index)}
                          className="p-2 text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                          title="Delete skill"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Active Publications & Archive Milestones */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  {/* Publications */}
                  <div className="space-y-4 shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <FileText size={13} className="text-indigo-500" />{" "}
                        Publications Array
                      </h3>
                      <button
                        onClick={addNewPub}
                        className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/15 rounded text-xs font-black uppercase tracking-wider"
                      >
                        Add Item
                      </button>
                    </div>
                    <div className="space-y-3">
                      {profile.publications.map((pub, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-55/40 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative"
                        >
                          <button
                            onClick={() => deletePub(idx)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="space-y-1 pr-6">
                            <input
                              type="text"
                              value={pub.title}
                              placeholder="Title"
                              onChange={(e) =>
                                handlePubChange(idx, "title", e.target.value)
                              }
                              className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 pb-0.5"
                            />
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <input
                                type="text"
                                value={pub.journal}
                                placeholder="Journal Name"
                                onChange={(e) =>
                                  handlePubChange(
                                    idx,
                                    "journal",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent text-xs font-mono text-indigo-530 dark:text-indigo-400 outline-none"
                              />
                              <input
                                type="text"
                                value={pub.date}
                                placeholder="Year"
                                onChange={(e) =>
                                  handlePubChange(idx, "date", e.target.value)
                                }
                                className="w-full bg-transparent text-xs font-mono text-slate-400 outline-none text-right"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Milestones Archive */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-850 pb-2">
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Award size={13} className="text-indigo-500" />{" "}
                        Milestone Archive
                      </h3>
                      <button
                        onClick={addNewMilestone}
                        className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/15 rounded text-xs font-black uppercase tracking-wider"
                      >
                        Add Year
                      </button>
                    </div>
                    <div className="space-y-3">
                      {profile.archive.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-55/40 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 relative"
                        >
                          <button
                            onClick={() => deleteMilestone(idx)}
                            className="absolute top-3 right-3 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="grid grid-cols-12 gap-3 pr-6">
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={item.year}
                                placeholder="Year (e.g. 2026)"
                                onChange={(e) =>
                                  handleArchiveChange(
                                    idx,
                                    "year",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent text-xs font-bold text-indigo-500 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 font-mono pb-0.5"
                              />
                            </div>
                            <div className="col-span-9">
                              <input
                                type="text"
                                value={item.title}
                                placeholder="Title of Milestone"
                                onChange={(e) =>
                                  handleArchiveChange(
                                    idx,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                className="w-full bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 outline-none border-b border-slate-200 dark:border-slate-800 focus:border-indigo-500 pb-0.5"
                              />
                            </div>
                          </div>
                          <textarea
                            rows={2}
                            value={item.desc}
                            placeholder="Description of milestone accomplishment..."
                            onChange={(e) =>
                              handleArchiveChange(idx, "desc", e.target.value)
                            }
                            className="w-full bg-transparent text-xs text-slate-500 dark:text-slate-400 outline-none resize-none leading-relaxed"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status footer save button container */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="text-xs text-slate-505 dark:text-slate-405 font-bold">
                    All modifications are sync-saved directly to local storage
                    profiles automatically.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("dossier");
                  }}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-indigo-650/30 hover:bg-indigo-500 transition-colors"
                >
                  <Save size={13} /> Return to Dossier
                </button>
              </div>
            </motion.div>
          )}

          {/* ActiveTab 3: Credentials Academic clearance badges */}
          {activeTab === "credentials" && (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans">
                  Laboratory Clearance Tokens
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-bold max-w-3xl leading-relaxed">
                  Authorized laboratory personnel and safety clearance documents
                  generated interactively based on your selected node profile.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Badge 1 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Shield className="w-24 h-24 text-indigo-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-550/10 text-indigo-650 dark:text-indigo-400 rounded-2xl">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black tracking-widest text-emerald-550 px-2 py-0.5 bg-emerald-500/10 rounded-full uppercase">
                        Security: Active
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">
                        X-Ray Radiation Safety
                      </h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        Authorization for unsupervised high-energy synchrotron
                        and powder diffraction instrumentation rooms with
                        absolute zero exposure limits.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-xs leading-loose font-mono">
                    <p>&gt; Clearer: Radiation Control Board</p>
                    <p>&gt; License Ref: RC-SAFE-9214</p>
                    <p>
                      &gt; Signed: {profile.firstName} {profile.lastName}
                    </p>
                  </div>
                </div>

                {/* Badge 2 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Award className="w-24 h-24 text-cyan-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-cyan-550/10 text-cyan-650 dark:text-cyan-400 rounded-2xl">
                        <Award className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-500/10 rounded-full uppercase">
                        Permanent
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">
                        Crystallography Expert
                      </h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        Elected lifelong member of the International
                        Crystallography Union for substantial algorithmic
                        developments in profile modelling equations.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-xs leading-loose font-mono">
                    <p>
                      &gt; Holder: {profile.firstName} {profile.lastName}
                    </p>
                    <p>&gt; Reference: ICU-GOLD-2024</p>
                    <p>&gt; Rank: Fellow of the Union</p>
                  </div>
                </div>

                {/* Badge 3 */}
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                    <Database className="w-24 h-24 text-amber-500" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-amber-550/10 text-amber-655 dark:text-amber-400 rounded-2xl">
                        <Database className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black tracking-widest text-amber-500 px-2 py-0.5 bg-amber-500/10 rounded-full uppercase">
                        Level L-5
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight font-sans">
                        Symmetry Structure Key
                      </h4>
                      <p className="text-xs text-slate-455 font-bold leading-normal mt-1">
                        High priority node security key authorizing full system
                        matrix search calculations across classified ICSD
                        structural crystal records.
                      </p>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-6 text-slate-450 text-xs leading-loose font-mono">
                    <p>&gt; Cipher Hash: SHA-CRYPT-X52B</p>
                    <p>&gt; Token State: SYNC_ESTABLISHED</p>
                    <p>&gt; Clearance Grade: {profile.classification}</p>
                  </div>
                </div>
              </div>

              {/* Dynamic printed certificate card */}
              <div className="bg-slate-950 p-8 lg:p-12 border border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden font-serif max-w-4xl mx-auto text-slate-300">
                {/* Certificate framing elements */}
                <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-r from-amber-600 via-indigo-600 to-cyan-500 opacity-60" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-white/5 rounded-full flex items-center justify-center pointer-events-none p-10 text-center">
                  <span className="text-[120px] font-black text-white/[0.01] uppercase tracking-tighter select-none font-sans">
                    L-5 SECURE SEAL
                  </span>
                </div>

                <div className="space-y-8 relative z-10 text-center">
                  <div className="space-y-2">
                    <span className="text-xs font-black font-sans uppercase tracking-[0.4em] text-indigo-400 block">
                      Universal Crystallographic Commission
                    </span>
                    <h3 className="text-3xl text-white tracking-tight uppercase italic leading-none">
                      Certificate of Analytical Eminence
                    </h3>
                  </div>

                  <div className="w-16 h-px bg-amber-500/30 mx-auto" />

                  <p className="text-sm font-light leading-relaxed max-w-2xl mx-auto text-slate-400">
                    This document explicitly and securely registers structural
                    credentials verifying that{" "}
                    <span className="font-bold text-white italic underline">
                      {profile.firstName} {profile.lastName}
                    </span>{" "}
                    has satisfied compliance safety indices, qualifying as an
                    approved expert in diffraction physics models.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                    <div className="space-y-1 text-center md:text-left font-sans">
                      <span className="block text-xs font-black text-slate-500 uppercase tracking-widest">
                        Commission Signature
                      </span>
                      <p className="text-xs font-bold text-white mt-1 border-b border-white/10 pb-1 italic font-serif">
                        International XRD Board
                      </p>
                    </div>

                    <div className="flex items-center justify-center p-3">
                      <ShieldCheck className="w-12 h-12 text-amber-505/30" />
                    </div>

                    <div className="space-y-1 text-center md:text-right font-sans">
                      <span className="block text-xs font-black text-slate-500 uppercase tracking-widest font-sans">
                        Security Identification Code
                      </span>
                      <p className="text-xs font-mono font-bold text-indigo-400 mt-1 border-b border-indigo-500/10 pb-1">
                        {profile.idReference}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs font-mono text-slate-600 tracking-wider">
                    Bar hash validation verified on host port 3000 locally. Auth
                    checksum encrypted using standard cryptographic functions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Global credentials footnote */}
        <div className="text-center pt-8 border-t border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center gap-3 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full text-xs font-black uppercase tracking-[0.4em]">
            {profile.firstName} {profile.lastName} Studios • Established 2001
          </div>
        </div>
      </div>
    </div>
  );
};
