# Graph Report - .  (2026-08-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1883 nodes · 6490 edges · 117 communities (99 shown, 18 thin omitted)
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 1037 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3e180691`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- face-api.js
- r
- get
- makeTensorInfo
- runWebGLProgram
- E
- add
- devDependencies
- push
- slice
- read
- iterator
- disposeIntermediateTensorInfo
- throwIfDisposed
- constructor
- log
- runKernelFunc
- Z
- dispose
- call
- $lib/stores/auth.js
- forwardInput
- xe
- lj
- execute
- siswa/absensi/+page.svelte
- save
- then
- data
- load
- tj
- compute
- getNumber
- next
- concat
- ts
- getMap
- split
- compilerOptions
- apply
- processStack
- align
- incRef
- je
- ra
- It
- draw
- Es
- hr
- admin/siswa/+page.svelte
- build
- k3
- oc
- variable
- runAndExtendWithFaceDetections
- manifest.json
- toast.js
- dP
- initializeBackend
- extractParams
- now
- Xp
- ar
- setWeights
- toString
- i4
- downloadMatrixDriver
- find
- contextIdforContexts
- getNodeAtIndex
- Nr
- aC
- addItemToPoll
- b2
- i2
- serialForEach
- +layout.svelte
- MapModal.svelte
- extractBoxes
- assertIsValidBox
- O1
- matchDescriptor
- p4
- R1
- rescale
- M1
- vF
- app.d.ts
- aO
- N0
- br
- calibrate
- registerCallbackConstructor
- findLayer
- findShardForByte
- fK
- getDedupedMetricsNames
- runMobilenet
- T0
- pW
- tN
- setItem
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `get()` - 223 edges
2. `push()` - 217 edges
3. `E()` - 156 edges
4. `slice()` - 148 edges
5. `r()` - 146 edges
6. `a()` - 143 edges
7. `s()` - 131 edges
8. `makeTensorInfo()` - 130 edges
9. `i()` - 115 edges
10. `o()` - 102 edges

## Surprising Connections (you probably didn't know these)
- `admin/siswa/+page.svelte` --indirect_call--> `data()`  [INFERRED]
  src/routes/(app)/admin/siswa/+page.svelte → static/face-api/js/face-api.js
- `siswa/absensi/+page.svelte` --indirect_call--> `data()`  [INFERRED]
  src/routes/(app)/siswa/absensi/+page.svelte → static/face-api/js/face-api.js
- `penempatan/+page.svelte` --indirect_call--> `data()`  [INFERRED]
  src/routes/(app)/admin/penempatan/+page.svelte → static/face-api/js/face-api.js
- `perusahaan/+page.svelte` --indirect_call--> `data()`  [INFERRED]
  src/routes/(app)/admin/perusahaan/+page.svelte → static/face-api/js/face-api.js
- `pembimbing-industri/+page.svelte` --indirect_call--> `data()`  [INFERRED]
  src/routes/(app)/pembimbing-industri/+page.svelte → static/face-api/js/face-api.js

## Import Cycles
- None detected.

## Communities (117 total, 18 thin omitted)

### Community 0 - "face-api.js"
Cohesion: 0.01
Nodes (16): a0(), aV(), CG(), Cge(), CW(), EI(), KT(), L5() (+8 more)

### Community 1 - "r"
Cohesion: 0.05
Nodes (199): a(), Aa(), age(), aL(), aN(), aP(), b(), bD() (+191 more)

### Community 2 - "get"
Cohesion: 0.06
Nodes (73): ace(), bde(), che(), cpe(), Dce(), disposeData(), Ede(), Efe() (+65 more)

### Community 3 - "makeTensorInfo"
Cohesion: 0.05
Nodes (62): $7(), A7(), afe(), bie(), bufferSync(), bY(), cj(), cle() (+54 more)

### Community 4 - "runWebGLProgram"
Cohesion: 0.05
Nodes (60): ag(), Ane(), Bne(), cie(), coe(), cre(), Cse(), dae() (+52 more)

### Community 5 - "E"
Cohesion: 0.05
Nodes (48): _3(), a3(), az(), b3(), cP(), ct(), CU(), dL() (+40 more)

### Community 6 - "add"
Cohesion: 0.08
Nodes (39): ab(), add(), addFeed(), aH(), B5(), bt(), checkShape(), dM() (+31 more)

### Community 7 - "devDependencies"
Cohesion: 0.06
Nodes (35): chart.js, dependencies, chart.js, leaflet, @supabase/supabase-js, xlsx, devDependencies, svelte (+27 more)

### Community 8 - "push"
Cohesion: 0.07
Nodes (36): _4(), Bee(), cM(), compile(), createCallbacks(), D4(), dC(), eT() (+28 more)

### Community 9 - "slice"
Cohesion: 0.07
Nodes (36): _9(), b9(), Bme(), bO(), eq(), g9(), h2(), hA() (+28 more)

### Community 10 - "read"
Cohesion: 0.08
Nodes (36): abs(), assertNotDisposed(), checkNumericalProblems(), compileAndRun(), convertAndCacheOnCPU(), createTensorFromGPUData(), dataToGPU(), decode() (+28 more)

### Community 11 - "iterator"
Cohesion: 0.06
Nodes (34): batch(), columnMajorBatch(), columnNames(), concatenate(), decodeUTF8(), f8(), filter(), forEachAsync() (+26 more)

### Community 12 - "disposeIntermediateTensorInfo"
Cohesion: 0.08
Nodes (32): aae(), aue(), aX(), Bse(), cte(), disposeIntermediateTensorInfo(), Dse(), ga() (+24 more)

### Community 13 - "throwIfDisposed"
Cohesion: 0.08
Nodes (31): blockUntilAllProgramsCompleted(), buildVao(), bytes(), cast(), createFloat16MatrixTexture(), createFloat16PackedMatrixTexture(), createFloat32MatrixTexture(), createPackedMatrixTexture() (+23 more)

### Community 14 - "constructor"
Cohesion: 0.08
Nodes (31): constructor(), f9(), getAttr(), getCompilationKey(), getDepthCoordString(), getHeightCoordString(), getInputSamplingString(), getOutOfBoundsCondition() (+23 more)

### Community 15 - "log"
Cohesion: 0.08
Nodes (27): a9(), acquireTexture(), checkCompileCompletion(), checkCompileCompletionAsync(), checkCompletion_(), checkCompletionAsync_(), computeBytes(), create() (+19 more)

### Community 16 - "runKernelFunc"
Cohesion: 0.10
Nodes (25): addTapeNode(), checkKernelForMemLeak(), clone(), cloneAndKeepTensor(), endTape(), eO(), Ex(), getTensorsForGradient() (+17 more)

### Community 17 - "Z"
Cohesion: 0.11
Nodes (25): ae(), aI(), Bv(), ee(), hh(), iu(), J(), j1() (+17 more)

### Community 18 - "dispose"
Cohesion: 0.11
Nodes (25): bK(), checkTensorForDisposalWithNodeLiveUntilInfo(), clearAndClose(), delete(), dispose(), disposeRegisteredKernels(), disposeTensor(), disposeVariable() (+17 more)

### Community 19 - "call"
Cohesion: 0.11
Nodes (24): Aj(), Bg(), bs(), call(), centerCrop(), computeMask(), dh(), fixUnknownDimension() (+16 more)

### Community 20 - "$lib/stores/auth.js"
Cohesion: 0.12
Nodes (14): $lib/stores/auth.js, chart.js/auto, $lib/components/Button.svelte, $lib/components/InstallPrompt.svelte, $lib/components/MapModal.svelte, $lib/components/Modal.svelte, $app/navigation, $lib/stores/penempatan.js (+6 more)

### Community 21 - "forwardInput"
Cohesion: 0.20
Nodes (21): AD(), arraySync(), computeFaceDescriptor(), dataSync(), detect(), detectLandmarks(), forward(), forwardInput() (+13 more)

### Community 22 - "xe"
Cohesion: 0.12
Nodes (21): bh(), db(), div(), gh(), ib(), lb(), nb(), Nn() (+13 more)

### Community 23 - "lj"
Cohesion: 0.17
Nodes (21): checkNumSamples(), fitDataset(), fitLoop(), getMonitorValue(), Ht(), Jr(), lj(), makeTrainFunction() (+13 more)

### Community 24 - "execute"
Cohesion: 0.16
Nodes (20): addStructuredOutputNames(), checkInputs(), checkInputShapeAndType(), checkOutputs(), cloneTensorList(), cloneTensorMap(), disposeIntermediateTensors(), execute() (+12 more)

### Community 25 - "siswa/absensi/+page.svelte"
Cohesion: 0.15
Nodes (12): detectFaces(), drawDetections(), loadFaceApi(), matchFace(), getCurrentPosition(), getDistance(), validateAttendanceTime(), siswa/absensi/+page.svelte (+4 more)

### Community 26 - "save"
Cohesion: 0.11
Nodes (24): append(), bN(), databaseAction(), getLoadHandlers(), getManager(), getSaveHandlers(), getSchemes(), gO() (+16 more)

### Community 27 - "then"
Cohesion: 0.13
Nodes (19): C5(), dfe(), eb(), El(), evaluateFlag(), fc(), fetch(), getAsync() (+11 more)

### Community 28 - "data"
Cohesion: 0.21
Nodes (13): auth, penempatan, supabase, penempatan/+page.svelte, perusahaan/+page.svelte, monitoring/+page.svelte, pembimbing-industri/absensi/+page.svelte, pembimbing-industri/+page.svelte (+5 more)

### Community 29 - "load"
Cohesion: 0.16
Nodes (14): $5(), convertTensorMapToTensorsMap(), D5(), findIOHandler(), jL(), load(), loadModelJSON(), loadStream() (+6 more)

### Community 30 - "tj"
Cohesion: 0.24
Nodes (10): checkTrainableWeightsConsistency(), countParams(), ej(), getClassName(), inputConv(), JH(), Ka(), tj() (+2 more)

### Community 31 - "compute"
Cohesion: 0.14
Nodes (17): calculateFirstParentOutputIndex(), calculateOutputIndex(), calculateOutputIndexRowSplit(), calculateOutputIndexValueRowID(), calculateOutputSize(), compute(), createNGrams(), getFirstDimensionSize() (+9 more)

### Community 32 - "getNumber"
Cohesion: 0.23
Nodes (16): beginQuery(), cA(), createFence(), endQuery(), getNumber(), getQueryTime(), getQueryTimerExtension(), getQueryTimerExtensionWebGL1() (+8 more)

### Community 33 - "next"
Cohesion: 0.13
Nodes (16): chooseIndex(), cropAndResizeFrame(), DE(), flattenQueue(), getAudioData(), getTensorFromAudioDataArray(), H5(), next() (+8 more)

### Community 34 - "concat"
Cohesion: 0.15
Nodes (15): concat(), f4(), gather(), hz(), k2(), Lie(), nonTrainableWeights(), popBack() (+7 more)

### Community 35 - "ts"
Cohesion: 0.15
Nodes (14): aee(), fA(), getUniformLocation(), L2(), mA(), P0(), pk(), poolingFunction() (+6 more)

### Community 36 - "getMap"
Cohesion: 0.40
Nodes (5): getMap(), HI(), r2(), register(), Yt()

### Community 37 - "split"
Cohesion: 0.14
Nodes (18): Ba(), bj(), checkManifestAndWeightFiles(), getWeightUrls(), gK(), kI(), loadTrainingConfig(), loadWeights() (+10 more)

### Community 38 - "compilerOptions"
Cohesion: 0.15
Nodes (12): compilerOptions, allowJs, checkJs, esModuleInterop, forceConsistentCasingInFileNames, moduleResolution, resolveJsonModule, skipLibCheck (+4 more)

### Community 39 - "apply"
Cohesion: 0.15
Nodes (13): addInboundNode(), addLoss(), addWeight(), apply(), assertInputCompatibility(), eH(), Ff(), nH() (+5 more)

### Community 40 - "processStack"
Cohesion: 0.19
Nodes (13): checkTensorForDisposal(), EM(), L1(), mapArgsToSignature(), mapArgToTensorInfo(), mapFunction(), mapNode(), mapSignatureEntries() (+5 more)

### Community 41 - "align"
Cohesion: 0.17
Nodes (12): align(), alignDlib(), alignMinBbox(), Ek(), getLeftEye(), getMouth(), getRefPointsForAlignment(), getRightEye() (+4 more)

### Community 42 - "incRef"
Cohesion: 0.18
Nodes (11): applyGradients(), assign(), computeGradients(), Dw(), epsilon(), floatPrecision(), incRef(), incrementIterations() (+3 more)

### Community 43 - "je"
Cohesion: 0.18
Nodes (11): AW(), je(), Lc(), lN(), lW(), ns(), uP(), Uw() (+3 more)

### Community 44 - "ra"
Cohesion: 0.29
Nodes (11): bP(), convertValue(), HN(), isValidTruncated(), nextValue(), oz(), qL(), ra() (+3 more)

### Community 45 - "It"
Cohesion: 0.20
Nodes (11): computeSingleOutputShape(), cz(), Dv(), getInitialState(), getStates(), It(), pN(), qM() (+3 more)

### Community 46 - "draw"
Cohesion: 0.24
Nodes (10): asSortedArray(), draw(), getUpperLeft(), jk(), measureHeight(), measureWidth(), nge(), oge() (+2 more)

### Community 47 - "Es"
Cohesion: 0.33
Nodes (10): at(), en(), Es(), FT(), o0(), pr(), ps(), Vx() (+2 more)

### Community 48 - "hr"
Cohesion: 0.22
Nodes (10): fz(), hr(), nk(), ph(), R7(), sM(), t7(), WY() (+2 more)

### Community 49 - "admin/siswa/+page.svelte"
Cohesion: 0.22
Nodes (3): SISWA_TEMPLATE, admin/siswa/+page.svelte, generatingAkun

### Community 50 - "build"
Cohesion: 0.28
Nodes (9): build(), computeElementwiseOpOutputShape(), interpretAxes(), JI(), predict(), predictLoop(), predictOnBatch(), summary() (+1 more)

### Community 51 - "k3"
Cohesion: 0.31
Nodes (9): bw(), customGrad(), k3(), sf(), tT(), us(), x3(), y3() (+1 more)

### Community 52 - "oc"
Cohesion: 0.25
Nodes (8): disposeMasks(), getMask(), getValue(), hasKey(), makeTestFunction(), names(), oc(), UI()

### Community 53 - "variable"
Cohesion: 0.28
Nodes (9): freeze(), getFrozenParams(), getParamFromPath(), getParamList(), getTrainableParams(), reassignParamFromPath(), serializeParams(), traversePropertyPath() (+1 more)

### Community 54 - "runAndExtendWithFaceDetections"
Cohesion: 0.31
Nodes (9): jd(), runAndExtendWithFaceDetection(), runAndExtendWithFaceDetections(), runNet(), withAgeAndGender(), withFaceDescriptors(), withFaceExpressions(), withFaceLandmarks() (+1 more)

### Community 55 - "manifest.json"
Cohesion: 0.22
Nodes (8): background_color, description, display, icons, name, short_name, start_url, theme_color

### Community 56 - "toast.js"
Cohesion: 0.29
Nodes (3): toast, absensi-wajah/+page.svelte, pembimbing-industri/jurnal/+page.svelte

### Community 57 - "dP"
Cohesion: 0.29
Nodes (8): Ak(), clipAtImageBorders(), dP(), floor(), getInput(), reshapedInputDimensions(), toBatchTensor(), yr()

### Community 58 - "initializeBackend"
Cohesion: 0.36
Nodes (8): backend(), findBackend(), getSortedBackends(), initializeBackend(), initializeBackendsAndReturnBest(), ready(), setBackend(), setupRegisteredKernels()

### Community 59 - "extractParams"
Cohesion: 0.32
Nodes (8): bge(), extractClassifierParams(), extractParams(), extractWeights(), getClassifierChannelsIn(), getClassifierChannelsOut(), loadClassifierParams(), Zge()

### Community 60 - "now"
Cohesion: 0.29
Nodes (8): EG(), endTimer(), kc(), now(), profileKernel(), shuffle(), startTimer(), time()

### Community 61 - "Xp"
Cohesion: 0.29
Nodes (8): fi(), jg(), jP(), oi(), Qv(), Tc(), vP(), Xp()

### Community 62 - "ar"
Cohesion: 0.38
Nodes (7): ar(), Kx(), l0(), Lg(), lh(), verifyArgs(), zg()

### Community 63 - "setWeights"
Cohesion: 0.29
Nodes (7): b0(), extractIterations(), getNamedWeights(), getWeights(), saveIterations(), setWeights(), Zx()

### Community 64 - "toString"
Cohesion: 0.18
Nodes (12): Af(), buildNodeConversionMap(), calculateLosses(), getDefaultModelName(), jq(), loadFromDisk(), loadFromUri(), loadFromWeightMap() (+4 more)

### Community 65 - "i4"
Cohesion: 0.33
Nodes (6): a4(), c2(), i4(), o4(), r4(), s4()

### Community 66 - "downloadMatrixDriver"
Cohesion: 0.40
Nodes (6): bindTextureToFrameBuffer(), createBufferFromTexture(), downloadByteEncodedFloatMatrixFromOutputTexture(), downloadMatrixDriver(), downloadMatrixFromPackedTexture(), unbindTextureToFrameBuffer()

### Community 67 - "find"
Cohesion: 0.33
Nodes (6): checkKeyAndValueTensor(), dN(), find(), findWithDefault(), getHashTableHandleByName(), import()

### Community 68 - "contextIdforContexts"
Cohesion: 0.33
Nodes (6): contextIdforContexts(), currentContext(), enterFrame(), generateCurrentContextIds(), newFrame(), nextIteration()

### Community 69 - "getNodeAtIndex"
Cohesion: 0.40
Nodes (5): getInputAt(), getNodeAtIndex(), getOutputAt(), input(), output()

### Community 70 - "Nr"
Cohesion: 0.50
Nodes (5): getLossIdentifiers(), getMetricIdentifiers(), getTrainingConfig(), Nr(), qx()

### Community 71 - "aC"
Cohesion: 0.50
Nodes (4): aC(), lq(), rC(), wH()

### Community 72 - "addItemToPoll"
Cohesion: 0.50
Nodes (4): addItemToPoll(), createAndWaitForFence(), pollFence(), pollItems()

### Community 73 - "b2"
Cohesion: 0.67
Nodes (4): b2(), f2(), g2(), y2()

### Community 74 - "i2"
Cohesion: 0.50
Nodes (4): i2(), jB(), s2(), u2()

### Community 75 - "serialForEach"
Cohesion: 0.50
Nodes (4): resolveWhile(), serial(), serialForEach(), serialMapAsync()

### Community 78 - "extractBoxes"
Cohesion: 1.00
Nodes (3): array(), extractBoxes(), extractPredictedClass()

### Community 79 - "assertIsValidBox"
Cohesion: 0.67
Nodes (3): assertIsValidBox(), assertIsValidLabeledBox(), isRect()

### Community 80 - "O1"
Cohesion: 0.67
Nodes (3): c6(), e6(), O1()

### Community 81 - "matchDescriptor"
Cohesion: 0.67
Nodes (3): computeMeanDistance(), findBestMatch(), matchDescriptor()

### Community 82 - "p4"
Cohesion: 0.67
Nodes (3): d2(), l4(), p4()

### Community 83 - "R1"
Cohesion: 0.67
Nodes (3): i6(), R1(), s6()

### Community 84 - "rescale"
Cohesion: 0.67
Nodes (3): ig(), relativeBox(), rescale()

### Community 85 - "M1"
Cohesion: 0.67
Nodes (3): M1(), n6(), t6()

### Community 86 - "vF"
Cohesion: 0.67
Nodes (3): _re(), vF(), Xae()

## Knowledge Gaps
- **56 isolated node(s):** `auth`, `allowJs`, `checkJs`, `esModuleInterop`, `forceConsistentCasingInFileNames` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `data()` connect `data` to `face-api.js`, `r`, `find`, `push`, `read`, `je`, `throwIfDisposed`, `extractBoxes`, `admin/siswa/+page.svelte`, `dispose`, `forwardInput`, `xe`, `lj`, `siswa/absensi/+page.svelte`, `then`, `now`, `setWeights`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `siswa/absensi/+page.svelte` connect `siswa/absensi/+page.svelte` to `toast.js`, `$lib/stores/auth.js`, `data`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `routes/+page.svelte` connect `$lib/stores/auth.js` to `data`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Are the 113 inferred relationships involving `r()` (e.g. with `Aa()` and `abs()`) actually correct?**
  _`r()` has 113 INFERRED edges - model-reasoned connections that need verification._
- **What connects `auth`, `allowJs`, `checkJs` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `face-api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.00684931506849315 - nodes in this community are weakly interconnected._
- **Should `r` be split into smaller, more focused modules?**
  _Cohesion score 0.053855134257144305 - nodes in this community are weakly interconnected._