import React from 'react';
import { cn } from '../lib/utils';
import { postMessageToExtension } from '../utils/vscode';
import stateManager from '../utils/stateManager';
import { ArianaCliStatus } from '../lib/cli';

// Define enum for installation methods
enum ArianaInstallMethod {
	NPM = 'npm',
	PIP = 'pip',
	PYTHON_PIP = 'python -m pip',
	PYTHON3_PIP = 'python3 -m pip',
	UNKNOWN = 'unknown'
}

interface OnboardingStepProps {
	number: number;
	title: string;
	description?: string;
	active: boolean;
	completed?: boolean;
	children?: React.ReactNode;
}

const OnboardingStep: React.FC<OnboardingStepProps> = ({
	number,
	title,
	description,
	active,
	completed,
	children
}) => {
	return (
		<div className={cn(
			"flex relative not-last:pb-8",
			active ? "opacity-100" : "opacity-60"
		)}>
			<div className={cn(
				"flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg relative z-10",
				completed ? "bg-green-600 text-white" : "bg-[var(--accent)] text-[var(--fg-3)]"
			)}>
				{completed ? "✓" : number}
			</div>
			<div className="flex-grow pl-4 w-full">
				<h3 className="text-lg font-semibold mb-1 text-[var(--fg-0)]">{title}</h3>
				{description && <p className="text-[var(--fg-2)]">{description}</p>}
				{children && (
					<div className="mt-2 w-full">
						{children}
					</div>
				)}
			</div>
			{number < 4 && (
				<div className="absolute left-5 top-10 w-0.5 bg-[var(--accent)] text-[var(--fg-3)]" style={{ height: 'calc(100% - 29px)' }} />
			)}
		</div>
	);
};

interface InstallOptionProps {
	method: ArianaInstallMethod;
	command: string;
	available: boolean;
	onInstall: (method: ArianaInstallMethod) => void;
}

const InstallOption: React.FC<InstallOptionProps> = ({ method, command, available, onInstall }) => {
	return (
		<div className="mt-2">
			<div className={cn(
				"p-3 rounded-t-md font-mono text-sm",
				available ? "bg-[var(--bg-1)] text-[var(--fg-1)]" : "bg-[var(--bg-1)] text-[var(--fg-3)] opacity-50"
			)}>
				{command}
			</div>
			{available ? (
				<button 
					className="w-full p-2 bg-[var(--bg-3)] hover:bg-[var(--accent)] text-[var(--fg-3)] rounded-b-md hover:bg-opacity-90 transition-colors cursor-pointer"
					onClick={() => onInstall(method)}
				>
					Run in Terminal
				</button>
			) : (
				<div className="w-full p-2 bg-[var(--bg-2)] text-[var(--fg-3)] rounded-b-md text-center">
					{method} not available
				</div>
			)}
		</div>
	);
};

interface OnboardingPanelProps {
  cliStatus: ArianaCliStatus | null;
}

const OnboardingPanel: React.FC<OnboardingPanelProps> = ({ cliStatus }) => {
	// Use state manager for persisting collapsed state
	const [isCollapsed, setIsCollapsed] = stateManager.usePersistedState<boolean>('isOnboardingCollapsed', false);

	// Save collapsed state
	const handleToggleCollapse = () => {
		const newState = !isCollapsed;
		setIsCollapsed(newState);
		localStorage.setItem('ariana-has-seen-onboarding', newState.toString());
	};

	// Handle installation
	const handleInstall = (method: ArianaInstallMethod) => {
		postMessageToExtension({ 
			command: 'installArianaCli',
			method: method
		});
	};

	return (
    <div className="rounded-md bg-[var(--bg-0)]">
      <div
        className={"group sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[var(--bg-0)] cursor-pointer hover:bg-[var(--bg-2)] transition-colors rounded-sm " + (isCollapsed ? '' : 'border-solid border-b-2 border-[var(--bg-1)] rounded-b-none')}
        onClick={handleToggleCollapse}
      >
        <h2 className="text-lg font-semibold text-[var(--fg-3)] group-hover:text-[var(--fg-0)]">👋 Getting Started</h2>
        <div className={"h-3 w-3 group-hover:bg-[var(--bg-3)] " + (isCollapsed ? 'rounded-full bg-[var(--bg-1)]' : 'rounded-xs bg-[var(--bg-2)]')}>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pt-2 pb-10 mt-2">
          <div className="space-y-2">
            <OnboardingStep
              number={1}
              title="Install Ariana CLI"
              active={true}
              completed={cliStatus?.isInstalled}
            >
              {cliStatus?.isInstalled ? (
                <p className="text-[var(--fg-2)]">Ariana CLI is installed. {cliStatus.version && `Version: ${cliStatus.version.split('ariana ')[1]}`}</p>
              ) : (
                <div className="space-y-4">
                  <p className="text-[var(--fg-2)]">Install the Ariana CLI to allow Ariana to run with your code. (Ariana will create a copy of your JS, TS or Python code, rewritten with instrumentation, will run that copy and spy on its execution.)</p>
                  
                  {cliStatus && (
                    <div className="space-y-4">
                      {cliStatus.npmAvailable && (
                        <InstallOption 
                          method={ArianaInstallMethod.NPM} 
                          command="npm install -g ariana" 
                          available={cliStatus.npmAvailable}
                          onInstall={handleInstall}
                        />
                      )}
                      
                      {cliStatus.pipAvailable && (
                        <InstallOption 
                          method={ArianaInstallMethod.PIP} 
                          command="pip install ariana" 
                          available={cliStatus.pipAvailable}
                          onInstall={handleInstall}
                        />
                      )}
                      
                      {cliStatus.pythonPipAvailable && (
                        <InstallOption 
                          method={ArianaInstallMethod.PYTHON_PIP} 
                          command="python -m pip install ariana" 
                          available={cliStatus.pythonPipAvailable}
                          onInstall={handleInstall}
                        />
                      )}
                      
                      {cliStatus.python3PipAvailable && (
                        <InstallOption 
                          method={ArianaInstallMethod.PYTHON3_PIP} 
                          command="python3 -m pip install ariana" 
                          available={cliStatus.python3PipAvailable}
                          onInstall={handleInstall}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </OnboardingStep>

            <OnboardingStep
              number={2}
              title="Run your code with Ariana"
              active={cliStatus?.isInstalled || false}
            >
              <div className="flex flex-col gap-2 text-[var(--fg-2)]">
                <p className="">Ariana must watch your code both build & run. So build & run your code from the terminal as you normally would, but add <span className="text-[var(--accent)] font-mono">ariana</span> before the command.</p>
                <div className="p-3 my-2 rounded-md font-mono bg-[var(--bg-1)] text-[var(--fg-1)]">
                  ariana <span className="text-[var(--accent)]">{'<your build & run command>'}</span>
                </div>
                <p className="font-semibold italic text-[var(--fg-3)]">Ariana supports JS, TS & Python at the moment.</p>
                <p className="text-[var(--fg-2)]">Examples:</p>
                <div className="flex my-2 flex-col gap-2">
                  <div className="p-3 rounded-md font-mono bg-[var(--bg-1)] text-[var(--fg-1)]">
                    ariana <span className="text-[var(--accent)]">python my_script.py</span>
                  </div>
                  <div className="p-3 rounded-md font-mono bg-[var(--bg-1)] text-[var(--fg-1)]">
                    ariana <span className="text-[var(--accent)]">npm run dev</span>
                  </div>
                </div>
                <p className="">Do the above in multiple terminal windows for each module of your code you want to run.</p>
                <p className="text-[var(--fg-2)]">Examples:</p>
                <div className="flex my-2 flex-col gap-2">
                  <div className="p-3 rounded-md font-mono bg-[var(--bg-1)] text-[var(--fg-1)]">
                    <span className="text-[var(--fg-2)]">cd frontend/</span>
                    <br />
                    ariana <span className="text-[var(--accent)]">npm run dev</span>
                  </div>
                  <div className="p-3 rounded-md font-mono bg-[var(--bg-1)] text-[var(--fg-1)]">
                    <span className="text-[var(--fg-2)]">cd backend/</span>
                    <br />
                    ariana <span className="text-[var(--accent)]">uv run server.py</span>
                  </div>
                </div>
                <p className="">If building & running requires 2 or more commands, either create a script and run it with <div className="inline p-1 rounded-md font-mono bg-[var(--bg-1)] text-[var(--accent)]">ariana {'./<my_script>'}</div>, or open a new shell with <div className="inline p-1 rounded-md font-mono bg-[var(--bg-1)] text-[var(--accent)]">ariana bash</div> on linux/macOS or <div className="inline p-1 rounded-md font-mono bg-[var(--bg-1)] text-[var(--accent)]">ariana powershell.exe</div> on Windows, and run your commands there.</p>
              </div>
            </OnboardingStep>

            <OnboardingStep
              number={3}
              title="View and analyze traces"
              active={cliStatus?.isInstalled || false}
            >
              <div className="space-y-4 text-[var(--fg-2)]">
                <p className="">After running your code with Ariana, switch to the <b>Analyze</b> tab to view execution traces.</p>
                <p className="">Click on a trace to highlight the corresponding code in your editor.</p>
              </div>
            </OnboardingStep>

            <OnboardingStep
              number={4}
              title="Any issue?"
              active={cliStatus?.isInstalled || false}
            >
              <div className="space-y-4 text-[var(--fg-2)]">
                <p className="">Join <a className="text-[var(--accent)] hover:underline" href="https://discord.gg/Y3TFTmE89g">our Discord community</a> to connect with other developers and get help with Ariana.</p>
              </div>
            </OnboardingStep>
          </div>
        </div>
      )}

    </div>
	);
};

export default OnboardingPanel;
