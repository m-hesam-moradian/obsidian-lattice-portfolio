export type ArtifactType =
  | 'attention-lattice'
  | 'zk-circuit'
  | 'consensus-mesh'
  | 'agent-graph';

export type ParticleShapeId =
  | 'neural'
  | 'github'
  | 'x'
  | 'huggingface'
  | 'linkedin';

export interface ArchitectureNode {
  stage: string;
  title: string;
  detail: string;
}

export interface ProjectMetric {
  label: string;
  value: string;
  context: string;
}

export interface ProjectCaseStudy {
  id: string;
  indexLabel: string;
  title: string;
  domain: string;
  year: string;
  coordinates: string;
  artifactType: ArtifactType;
  summary: string;
  challenge: string;
  solution: string;
  architectureNodes: ArchitectureNode[];
  metrics: ProjectMetric[];
  stack: string[];
  links: {
    repository?: string;
    paperOrDemo?: string;
  };
}

export interface PedestalChannel {
  id: ParticleShapeId;
  indexLabel: string;
  label: string;
  handle: string;
  description: string;
  actionLabel: string;
  url: string;
  isEmail?: boolean;
}

export interface ChapterDefinition {
  id: 'summit' | 'works' | 'portal' | 'pedestal';
  index: string;
  label: string;
  scrollTarget: number;
  range: [number, number];
}

export const ENGINEER_PROFILE = {
  wordmark: 'MORADIAN',
  roleLine: 'AI, Machine Learning & Blockchain Systems',
  email: 'm.hesam.moradian@gmail.com',
  manifesto:
    'Engineering verifiable neural architectures, zero-knowledge compute, and high-throughput consensus protocols.',
  copyright: 'Copyright 2026 H. Moradian',
};

export const CHAPTERS: ChapterDefinition[] = [
  {
    id: 'summit',
    index: '01',
    label: 'Neural Summit',
    scrollTarget: 0.0,
    range: [0.0, 0.17],
  },
  {
    id: 'works',
    index: '02',
    label: 'Selected Systems',
    scrollTarget: 0.27,
    range: [0.17, 0.61],
  },
  {
    id: 'portal',
    index: '03',
    label: 'Consensus Iris',
    scrollTarget: 0.72,
    range: [0.61, 0.81],
  },
  {
    id: 'pedestal',
    index: '04',
    label: 'Network Pedestal',
    scrollTarget: 0.94,
    range: [0.81, 1.0],
  },
];

export const PROJECT_CASE_STUDIES: ProjectCaseStudy[] = [
  {
    id: 'sparse-tensor-router',
    indexLabel: '01',
    title: 'Sparse Tensor Router',
    domain: 'AI Systems · Distributed ML',
    year: '2026',
    coordinates: 'LAYER 01 · TENSOR FABRIC',
    artifactType: 'attention-lattice',
    summary:
      'Low-latency Mixture-of-Experts routing kernel and topology-aware all-to-all dispatch fabric across multi-node GPU clusters.',
    challenge:
      'Standard All-to-All communication stalls MoE transformer training when imbalanced token routing saturates inter-node InfiniBand links.',
    solution:
      'Designed a fused CUDA capacity-aware gating kernel paired with hierarchical ring-all-to-all scheduling that overlaps NVLink intra-node shards with RDMA transfers.',
    architectureNodes: [
      {
        stage: 'Stage 01',
        title: 'Token Gating Kernel',
        detail: 'Top-2 Sinkhorn balanced dispatch in FP8 with zero host sync.',
      },
      {
        stage: 'Stage 02',
        title: 'NVLink Shard Relay',
        detail: 'Coalesced intra-node shared memory buffers minimize PCIe hops.',
      },
      {
        stage: 'Stage 03',
        title: 'RDMA Overlap Pipe',
        detail: 'Asynchronous NCCL streams mask 78% of cross-rack latency.',
      },
      {
        stage: 'Stage 04',
        title: 'Expert GEMM Fusion',
        detail: 'Grouped CUTLASS kernels execute variable batch sizes inline.',
      },
    ],
    metrics: [
      {
        label: 'Throughput Gain',
        value: '+41.8%',
        context: '64x H100 cluster vs baseline Megatron-Core',
      },
      {
        label: 'Dispatch Overhead',
        value: '0.34 ms',
        context: 'P99 all-to-all latency at 8k context length',
      },
      {
        label: 'MFU Utilization',
        value: '58.4%',
        context: 'Sustained Model FLOPs Utilization on 140B MoE',
      },
      {
        label: 'Load Variance',
        value: '< 1.9%',
        context: 'Across 16 routed experts per transformer block',
      },
    ],
    stack: ['CUDA C++', 'PyTorch', 'Triton', 'NCCL', 'CUTLASS', 'Rust'],
    links: {
      repository: 'https://github.com/m-hesam-moradian',
      paperOrDemo: 'https://huggingface.co',
    },
  },
  {
    id: 'zk-inference-verifier',
    indexLabel: '02',
    title: 'ZK-Inference Verifier',
    domain: 'Zero-Knowledge · Cryptography',
    year: '2025',
    coordinates: 'LAYER 02 · ARITHMETIC PROOF',
    artifactType: 'zk-circuit',
    summary:
      'Recursive Halo2 and KZG polynomial commitment pipeline proving INT8 neural forward passes deterministically on EVM rollups.',
    challenge:
      'Non-linear activations such as GeLU and Softmax explode arithmetic constraint counts inside finite-field SNARK circuits.',
    solution:
      'Replaced bit-decomposition checks with Plookup table arguments over fixed-point quantization intervals, folding layers recursively into a single constant-size EVM proof.',
    architectureNodes: [
      {
        stage: 'Stage 01',
        title: 'Fixed-Point Compiler',
        detail: 'Lowers ONNX computational graphs into Q7.24 field elements.',
      },
      {
        stage: 'Stage 02',
        title: 'Plookup Non-Linearities',
        detail: '16-bit quantized activation tables cut constraints by 14x.',
      },
      {
        stage: 'Stage 03',
        title: 'Halo2 Witness Prover',
        detail: 'GPU-accelerated MSM and NTT over BN254 curve parameters.',
      },
      {
        stage: 'Stage 04',
        title: 'On-Chain Verifier',
        detail: 'Single pairing check verifying model weights and output hash.',
      },
    ],
    metrics: [
      {
        label: 'Proof Verification',
        value: '218k gas',
        context: 'Constant EVM verification cost regardless of depth',
      },
      {
        label: 'Prover Speedup',
        value: '11.4x',
        context: 'Over baseline CPU witness synthesis on ResNet-18',
      },
      {
        label: 'Accuracy Delta',
        value: '-0.12%',
        context: 'Top-1 drift under deterministic INT8 quantization',
      },
      {
        label: 'Proof Payload',
        value: '1.28 KB',
        context: 'Compressed recursive SNARK calldata footprint',
      },
    ],
    stack: ['Rust', 'Halo2', 'BN254', 'Solidity', 'ONNX', 'WebGPU'],
    links: {
      repository: 'https://github.com/m-hesam-moradian',
      paperOrDemo: 'https://arxiv.org',
    },
  },
  {
    id: 'consensus-state-mesh',
    indexLabel: '03',
    title: 'Consensus State Mesh',
    domain: 'Blockchain · Protocol Engineering',
    year: '2025',
    coordinates: 'LAYER 03 · DAG CONSENSUS',
    artifactType: 'consensus-mesh',
    summary:
      'DAG-backed BFT mempool and optimistic parallel EVM execution engine engineered for deterministic state transitions under heavy contention.',
    challenge:
      'Sequential transaction execution bottlenecks block finality during high-frequency oracle updates and decentralized orderbook bursts.',
    solution:
      'Implemented Narwhal-style certified DAG batch dissemination coupled with Block-STM optimistic concurrency control and a lock-free Merkle Patricia Trie cache.',
    architectureNodes: [
      {
        stage: 'Stage 01',
        title: 'DAG Mempool Workers',
        detail: 'Parallel primary-worker batching decouples data from ordering.',
      },
      {
        stage: 'Stage 02',
        title: 'Zero-Overhead BFT',
        detail: '2-round commit rule derives total order from local DAG waves.',
      },
      {
        stage: 'Stage 03',
        title: 'Optimistic Scheduler',
        detail: 'Speculative multi-core execution with read/write set validation.',
      },
      {
        stage: 'Stage 04',
        title: 'Versioned State DB',
        detail: 'Async memory-mapped trie commitments flush in background.',
      },
    ],
    metrics: [
      {
        label: 'Sustained TPS',
        value: '48,200',
        context: 'Mixed ERC-20 & AMM swap workload across 32 validators',
      },
      {
        label: 'Time to Finality',
        value: '420 ms',
        context: 'P95 Byzantine finality across geo-distributed nodes',
      },
      {
        label: 'Parallel Speedup',
        value: '6.8x',
        context: 'On 16-core validator nodes at 15% conflict rate',
      },
      {
        label: 'State Root Latency',
        value: '18.5 ms',
        context: 'Incremental trie hashing per 10,000-tx block',
      },
    ],
    stack: ['Rust', 'Tokio', 'revm', 'BLS12-381', 'RocksDB', 'gRPC'],
    links: {
      repository: 'https://github.com/m-hesam-moradian',
    },
  },
  {
    id: 'autonomous-agent-protocol',
    indexLabel: '04',
    title: 'Autonomous Agent Protocol',
    domain: 'AI Agents · Smart Contracts',
    year: '2024',
    coordinates: 'LAYER 04 · ATTESTED GRAPH',
    artifactType: 'agent-graph',
    summary:
      'Cryptographically attested multi-agent orchestration layer binding LLM tool-call execution to TEE quotes and on-chain policy invariants.',
    challenge:
      'Autonomous agents managing treasury liquidity or governance lack verifiable guarantees that off-chain inference adhered to safety bounds.',
    solution:
      'Wrapped structured reasoning graphs inside confidential compute enclaves that sign deterministic intent payloads verified by smart contract policy guards.',
    architectureNodes: [
      {
        stage: 'Stage 01',
        title: 'State Graph Planner',
        detail: 'Bounded finite-state machine constrains agent tool transitions.',
      },
      {
        stage: 'Stage 02',
        title: 'Enclave Attestation',
        detail: 'Hardware TEE signs prompt hash, model digest, and action.',
      },
      {
        stage: 'Stage 03',
        title: 'Policy Guard Contract',
        detail: 'On-chain ECDSA & invariant checks enforce slippage and caps.',
      },
      {
        stage: 'Stage 04',
        title: 'Audit Telemetry Log',
        detail: 'Content-addressed execution traces anchored to IPFS.',
      },
    ],
    metrics: [
      {
        label: 'Policy Compliance',
        value: '100%',
        context: 'Zero unauthorized state mutations across 1.2M simulations',
      },
      {
        label: 'Attestation Latency',
        value: '14.2 ms',
        context: 'Overhead per signed multi-step reasoning turn',
      },
      {
        label: 'Tool Reliability',
        value: '99.4%',
        context: 'Grammar-constrained JSON schema adherence rate',
      },
      {
        label: 'Settlement Gas',
        value: '64k gas',
        context: 'Batched intent verification on L2 settlement layer',
      },
    ],
    stack: ['TypeScript', 'Python', 'Solidity', 'vLLM', 'Foundry', 'Intel TDX'],
    links: {
      repository: 'https://github.com/m-hesam-moradian',
      paperOrDemo: 'https://huggingface.co',
    },
  },
];

export const PEDESTAL_CHANNELS: PedestalChannel[] = [
  {
    id: 'neural',
    indexLabel: '01 / 05',
    label: 'Neural Core',
    handle: 'Systems & Research Focus',
    description:
      'Bridging sparse deep learning kernels with deterministic cryptographic protocols.',
    actionLabel: 'Copy Email',
    url: 'mailto:m.hesam.moradian@gmail.com',
    isEmail: true,
  },
  {
    id: 'github',
    indexLabel: '02 / 05',
    label: 'GitHub',
    handle: '@m-hesam-moradian',
    description:
      'Open-source CUDA kernels, Rust consensus prototypes, and Halo2 circuit libraries.',
    actionLabel: 'Open GitHub',
    url: 'https://github.com/m-hesam-moradian',
  },
  {
    id: 'x',
    indexLabel: '03 / 05',
    label: 'X / Twitter',
    handle: '@hmoradian_ai',
    description:
      'Research notes on MoE scaling laws, verifiable ML, and parallel execution.',
    actionLabel: 'Open X Profile',
    url: 'https://x.com',
  },
  {
    id: 'huggingface',
    indexLabel: '04 / 05',
    label: 'Hugging Face',
    handle: 'hmoradian-labs',
    description:
      'Quantized checkpoints, evaluation benchmarks, and reproducible inference weights.',
    actionLabel: 'Open Models',
    url: 'https://huggingface.co',
  },
  {
    id: 'linkedin',
    indexLabel: '05 / 05',
    label: 'LinkedIn',
    handle: 'M. Hesam Moradian',
    description:
      'Principal AI & Blockchain engineering experience, advisory, and collaborations.',
    actionLabel: 'Open LinkedIn',
    url: 'https://linkedin.com',
  },
];
