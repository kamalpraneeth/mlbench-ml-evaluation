"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  Cpu,
  Database,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Sliders,
  Settings2,
  FileCheck,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";

const STEPS = ["Task", "Dataset", "Preprocessing", "Model", "Training", "Review"];

export default function NewExperimentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [launching, setLaunching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [taskType, setTaskType] = useState<"classification" | "regression">("classification");
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [missingStrategy, setMissingStrategy] = useState("impute_mean");
  const [numericScaling, setNumericScaling] = useState("standard");
  const [categoricalEncoding, setCategoricalEncoding] = useState("onehot");
  const [trainSplit, setTrainSplit] = useState(0.70);
  const [framework, setFramework] = useState<"scikit-learn" | "pytorch">("pytorch");
  const [modelType, setModelType] = useState("PyTorchMLP");
  const [epochs, setEpochs] = useState(15);
  const [batchSize, setBatchSize] = useState(32);
  const [learningRate, setLearningRate] = useState(0.005);
  const [randomSeed, setRandomSeed] = useState(42);
  const [expName, setExpName] = useState("");

  useEffect(() => {
    api.getDatasets()
      .then((data) => {
        setDatasets(data);
        if (data.length > 0) {
          const matching = data.find((d) => d.task_type === taskType);
          setSelectedDatasetId(matching ? matching.id : data[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [taskType]);

  const handleTaskSelect = (t: "classification" | "regression") => {
    setTaskType(t);
    if (t === "classification") {
      setModelType(framework === "pytorch" ? "PyTorchMLP" : "RandomForestClassifier");
    } else {
      setModelType(framework === "pytorch" ? "PyTorchMLP" : "RandomForestRegressor");
    }
  };

  const handleFrameworkSelect = (f: "scikit-learn" | "pytorch") => {
    setFramework(f);
    if (f === "pytorch") {
      setModelType("PyTorchMLP");
    } else {
      setModelType(taskType === "classification" ? "RandomForestClassifier" : "RandomForestRegressor");
    }
  };

  const handleLaunch = async () => {
    setLaunching(true);
    setErrorMsg("");

    const name = expName.trim() || `${taskType === "classification" ? "Ticket Classifier" : "Price Predictor"} (${framework === "pytorch" ? "PyTorch" : "Sklearn"})`;

    const payload = {
      name,
      task_type: taskType,
      dataset_id: selectedDatasetId,
      framework,
      model_type: modelType,
      preprocessing: {
        missing_value_strategy: missingStrategy,
        numeric_scaling: numericScaling,
        categorical_encoding: categoricalEncoding,
        handle_duplicates: true,
        train_split: trainSplit,
        val_split: 0.15,
        test_split: 0.15,
        random_seed: randomSeed,
      },
      hyperparameters: {
        epochs,
        batch_size: batchSize,
        learning_rate: learningRate,
        random_seed: randomSeed,
        n_estimators: 60,
        max_depth: 10,
      },
    };

    try {
      const res = await api.createExperiment(payload);
      router.push(`/experiments/${res.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to launch experiment.");
      setLaunching(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">New Experiment</h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure and launch a new machine learning experiment with cross-framework benchmarking.
        </p>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;

          return (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  isActive
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/30 ring-2 ring-violet-500/30"
                    : isDone
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${isActive ? "text-white" : isDone ? "text-slate-300" : "text-slate-500"}`}>
                {step}
              </span>
              {idx < STEPS.length - 1 && <div className="w-8 sm:w-12 h-px bg-white/10 mx-1"></div>}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="p-8 rounded-2xl bg-[#0f172a] border border-white/5 min-h-[400px] flex flex-col justify-between">
        {/* STEP 1: TASK TYPE */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Select Task Type</h2>
            <p className="text-xs text-slate-400">Choose the machine learning task for your experiment.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Classification Card */}
              <div
                onClick={() => handleTaskSelect("classification")}
                className={`p-6 rounded-xl border cursor-pointer transition-all ${
                  taskType === "classification"
                    ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10"
                    : "border-white/5 bg-slate-900/50 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Classification</h3>
                <p className="text-xs text-slate-400 mb-4">Predict discrete categories and label probabilities</p>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>Text & ticket classification</li>
                  <li>Log anomaly detection</li>
                  <li>Multi-class probability distribution</li>
                  <li>Confusion matrix analysis</li>
                </ul>
              </div>

              {/* Regression Card */}
              <div
                onClick={() => handleTaskSelect("regression")}
                className={`p-6 rounded-xl border cursor-pointer transition-all ${
                  taskType === "regression"
                    ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10"
                    : "border-white/5 bg-slate-900/50 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Regression</h3>
                <p className="text-xs text-slate-400 mb-4">Predict continuous real-valued numerical outcomes</p>
                <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
                  <li>House price prediction</li>
                  <li>Resource & latency forecasting</li>
                  <li>MAE, MSE, RMSE, and R² metrics</li>
                  <li>Continuous error analysis</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DATASET SELECTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Select Dataset</h2>
            <p className="text-xs text-slate-400">Pick a registered dataset matching the {taskType} task.</p>

            <div className="grid grid-cols-1 gap-3">
              {datasets
                .filter((d) => d.task_type === taskType)
                .map((d) => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDatasetId(d.id)}
                    className={`p-4 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                      selectedDatasetId === d.id
                        ? "border-violet-500 bg-violet-600/10"
                        : "border-white/5 bg-slate-900/40 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center">
                        <Database className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{d.name}</div>
                        <div className="text-xs text-slate-400">
                          {d.row_count} rows • {d.col_count} columns • Target: <code className="text-indigo-300">{d.target_column}</code>
                        </div>
                      </div>
                    </div>
                    {selectedDatasetId === d.id && <CheckCircle2 className="w-5 h-5 text-violet-400" />}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* STEP 3: PREPROCESSING */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Configure Preprocessing Pipeline</h2>
            <p className="text-xs text-slate-400">Zero data-leakage transformations fitted strictly on training partition.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Missing Value Strategy</label>
                <select
                  value={missingStrategy}
                  onChange={(e) => setMissingStrategy(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="impute_mean">Mean Imputation (Numeric)</option>
                  <option value="impute_median">Median Imputation (Robust)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Numeric Feature Scaling</label>
                <select
                  value={numericScaling}
                  onChange={(e) => setNumericScaling(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="standard">StandardScaler (Zero mean, unit variance)</option>
                  <option value="minmax">MinMaxScaler (0 to 1 range)</option>
                  <option value="none">None (Raw values)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Categorical Feature Encoding</label>
                <select
                  value={categoricalEncoding}
                  onChange={(e) => setCategoricalEncoding(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                >
                  <option value="onehot">One-Hot Encoding</option>
                  <option value="ordinal">Ordinal Encoding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Train Partition Ratio: {trainSplit * 100}%</label>
                <input
                  type="range"
                  min="0.5"
                  max="0.85"
                  step="0.05"
                  value={trainSplit}
                  onChange={(e) => setTrainSplit(parseFloat(e.target.value))}
                  className="w-full accent-violet-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>50%</span>
                  <span>70% (Standard)</span>
                  <span>85%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: MODEL FRAMEWORK */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Select Model & Framework</h2>
            <p className="text-xs text-slate-400">Choose between Scikit-learn baselines and PyTorch deep neural networks.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div
                onClick={() => handleFrameworkSelect("pytorch")}
                className={`p-6 rounded-xl border cursor-pointer transition-all ${
                  framework === "pytorch"
                    ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10"
                    : "border-white/5 bg-slate-900/50 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center mb-4">
                  <Cpu className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">PyTorch Neural Network</h3>
                <p className="text-xs text-slate-400 mb-4">Multi-Layer Perceptron (MLP) with automatic ONNX export</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>• Supports dynamic batching</div>
                  <div>• Automatic ONNX Runtime validation</div>
                  <div>• Loss curve tracking per epoch</div>
                </div>
              </div>

              <div
                onClick={() => handleFrameworkSelect("scikit-learn")}
                className={`p-6 rounded-xl border cursor-pointer transition-all ${
                  framework === "scikit-learn"
                    ? "border-violet-500 bg-violet-600/10 shadow-lg shadow-violet-500/10"
                    : "border-white/5 bg-slate-900/50 hover:border-white/20"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
                  <Sliders className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Scikit-learn Baseline</h3>
                <p className="text-xs text-slate-400 mb-4">Random Forest ensemble model</p>
                <div className="text-xs text-slate-400 space-y-1">
                  <div>• Fast tabular convergence</div>
                  <div>• Multi-threaded CPU execution</div>
                  <div>• Serialized Joblib artifact</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: TRAINING HYPERPARAMETERS */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Configure Hyperparameters</h2>
            <p className="text-xs text-slate-400">Set optimization parameters and reproducible random seed.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Experiment Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. Support Ticket PyTorch Run 1"
                  value={expName}
                  onChange={(e) => setExpName(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Random Seed</label>
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value) || 42)}
                  className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                />
              </div>

              {framework === "pytorch" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Epochs: {epochs}</label>
                    <input
                      type="number"
                      min="5"
                      max="50"
                      value={epochs}
                      onChange={(e) => setEpochs(parseInt(e.target.value) || 15)}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Batch Size: {batchSize}</label>
                    <select
                      value={batchSize}
                      onChange={(e) => setBatchSize(parseInt(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="16">16</option>
                      <option value="32">32</option>
                      <option value="64">64</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Learning Rate</label>
                    <select
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500"
                    >
                      <option value="0.001">0.001</option>
                      <option value="0.005">0.005 (Recommended)</option>
                      <option value="0.01">0.01</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & LAUNCH */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Review & Launch Experiment</h2>
            <p className="text-xs text-slate-400">Confirm parameters before executing genuine training pipeline.</p>

            <div className="p-5 rounded-xl bg-slate-900/60 border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Task Type:</span>
                <span className="font-semibold text-white capitalize">{taskType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Framework:</span>
                <span className="font-semibold text-indigo-400 capitalize">{framework}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Model Architecture:</span>
                <span className="font-mono text-slate-200">{modelType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Preprocessing:</span>
                <span className="text-slate-200">{missingStrategy} • {numericScaling} scaler</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-slate-400">Training Partition:</span>
                <span className="text-slate-200">{trainSplit * 100}% train / 15% val / 15% test</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Random Seed:</span>
                <span className="font-mono text-slate-300">{randomSeed}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t border-white/5">
          {currentStep > 0 ? (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              disabled={launching}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-medium flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Previous
            </button>
          ) : (
            <Link
              href="/experiments"
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/5 text-slate-300 text-xs font-medium"
            >
              Cancel
            </Link>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              onClick={() => setCurrentStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-violet-600/30 flex items-center gap-2 disabled:opacity-50"
            >
              {launching ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Training Model & Exporting ONNX...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Launch Experiment
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
