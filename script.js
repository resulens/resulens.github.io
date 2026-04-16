document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const jobRoleSection = document.getElementById('job-role-section');
    const fileNameSpan = document.getElementById('uploaded-file-name');
    const removeFileBtn = document.getElementById('remove-file');
    const jobRoleInput = document.getElementById('job-role');
    const analyzeBtn = document.getElementById('analyze-btn');

    const dashboardSection = document.getElementById('dashboard');
    const resultScoreCircle = document.getElementById('result-score-circle');
    const resultScoreText = document.getElementById('result-score-text');
    const scoreStatusText = document.getElementById('score-status-text');
    const dynamicSkills = document.getElementById('dynamic-skills');
    const dynamicSuggestions = document.getElementById('dynamic-suggestions');

    let currentFile = null;

    // --- 1. File Upload Logic ---
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFileSelect(e.dataTransfer.files[0]);
    });

    browseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });

    function handleFileSelect(file) {
        const validExt = ['.pdf', '.docx', '.txt'];
        const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

        if (!validExt.includes(fileExt)) {
            alert('Unsupported format. Please upload PDF, DOCX, or TXT.');
            return;
        }

        currentFile = file;
        fileNameSpan.textContent = file.name;
        dropZone.classList.add('hidden');
        jobRoleSection.classList.remove('hidden');
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        jobRoleInput.value = '';
        jobRoleSection.classList.add('hidden');
        dropZone.classList.remove('hidden');
    });

    // --- 2. Dynamic Analysis Logic ---
    analyzeBtn.addEventListener('click', () => {
        const jobRole = jobRoleInput.value.trim();
        if (!jobRole) {
            alert('Please enter a target job role.');
            jobRoleInput.focus();
            return;
        }

        analyzeBtn.textContent = 'Processing...';
        analyzeBtn.disabled = true;

        const reader = new FileReader();

        reader.onload = function(e) {
            const fileContent = e.target.result || "";
            
            // Artificial delay to simulate processing
            setTimeout(() => {
                analyzeResumeDynamic(fileContent, jobRole);
                analyzeBtn.textContent = 'Analyze Suitability';
                analyzeBtn.disabled = false;
            }, 1000);
        };

        reader.onerror = function() {
            alert('Error reading the file.');
            analyzeBtn.textContent = 'Analyze Suitability';
            analyzeBtn.disabled = false;
        };

        // Read purely as text to evaluate actual content (no static/demo numbers)
        reader.readAsText(currentFile);
    });

    function analyzeResumeDynamic(rawText, jobRole) {
        // Convert to lowercase for matching
        const textToAnalyze = rawText.toLowerCase();

        // 1. Keyword Matching (Dynamic)
        const jobKeywords = jobRole.toLowerCase().split(/[ ,]+/).filter(w => w.length > 2);
        let matchedKeywords = 0;
        let missingKeywords = [];

        if (jobKeywords.length > 0) {
            jobKeywords.forEach(keyword => {
                if (textToAnalyze.includes(keyword)) {
                    matchedKeywords++;
                } else {
                    missingKeywords.push(keyword);
                }
            });
        }
        
        // Exact mathematical keyword match representation
        let keywordScore = jobKeywords.length > 0 ? Math.floor((matchedKeywords / jobKeywords.length) * 100) : 0;

        // 2. Formatting Score (Dynamic parsing for structural cues like bullets & line breaks)
        let formattingScore = 0;
        const lineBreaks = (textToAnalyze.match(/\n/g) || []).length;
        const bulletPoints = (textToAnalyze.match(/[-•*]/g) || []).length;
        
        if (lineBreaks > 5) formattingScore += 40;
        if (bulletPoints > 3) formattingScore += 40;
        
        // Check for common sections
        if (textToAnalyze.includes('education')) formattingScore += 10;
        if (textToAnalyze.includes('experience') || textToAnalyze.includes('work')) formattingScore += 10;
        
        if (formattingScore > 100) formattingScore = 100;

        // 3. Impact Score (Dynamic parsing for active verbs)
        const actionVerbs = ['managed', 'led', 'created', 'developed', 'designed', 'increased', 'improved', 'implemented', 'built', 'achieved', 'optimized'];
        let matchedActionVerbs = 0;

        actionVerbs.forEach(verb => {
            if (textToAnalyze.includes(verb)) matchedActionVerbs++;
        });

        // Max impact score achieved with 5 distinct action verbs
        let impactScore = Math.floor((matchedActionVerbs / 5) * 100);
        if (impactScore > 100) impactScore = 100;

        // Calculate Final ATS Score
        const finalAtsScore = Math.floor((keywordScore * 0.4) + (formattingScore * 0.3) + (impactScore * 0.3));

        // Inject the strictly calculated dynamic numbers to the dashboard
        renderDashboard(finalAtsScore, keywordScore, formattingScore, impactScore, missingKeywords);
    }

    // --- 3. Render Dashboard ---
    function getStatusData(score) {
        if (score >= 75) return { color: 'var(--color-green)', class: 'status-green', text: 'Excellent match' };
        if (score >= 50) return { color: 'var(--color-yellow)', class: 'status-yellow', text: 'Fair match, needs work' };
        return { color: 'var(--color-red)', class: 'status-red', text: 'Needs significant improvement' };
    }

    function renderDashboard(overallScore, keywords, formatting, impact, missingKws) {
        dashboardSection.classList.remove('hidden');
        dashboardSection.scrollIntoView({ behavior: 'smooth' });

        const mainProfile = getStatusData(overallScore);

        // Update Score Circular Display dynamically
        scoreStatusText.textContent = mainProfile.text;
        // Removed applying color to text native span to ensure it stays white like the design
        
        let count = 0;
        const circleInterval = setInterval(() => {
            count++;
            resultScoreText.textContent = count + '%';
            
            // Circle gradient dynamically updates its track color based on calculated score rules
            resultScoreCircle.style.background = `conic-gradient(${mainProfile.color} ${count}%, var(--bg-main) 0)`;
            
            if (count >= overallScore || overallScore === 0) {
                clearInterval(circleInterval);
                if (overallScore === 0) {
                    resultScoreText.textContent = '0%';
                    resultScoreCircle.style.background = `var(--bg-main)`;
                }
            }
        }, 15);

        // Update Progress Bars dynamically
        dynamicSkills.innerHTML = '';
        
        const metricList = [
            { name: "Keywords", score: keywords },
            { name: "Formatting", score: formatting },
            { name: "Impact", score: impact }
        ];

        metricList.forEach(metric => {
            const metricProfile = getStatusData(metric.score);
            const rowItem = document.createElement('div');
            rowItem.className = 'mock-bar-item';
            
            rowItem.innerHTML = `
                <div class="bar-labels">
                    <span>${metric.name}</span>
                    <span>${metric.score}%</span>
                </div>
                <div class="bar-track">
                    <div class="bar-fill ${metricProfile.class}" style="width: 0%; transition: width 1.2s ease-out"></div>
                </div>
            `;
            dynamicSkills.appendChild(rowItem);

            // Animate width
            setTimeout(() => {
                rowItem.querySelector('.bar-fill').style.width = metric.score + '%';
            }, 100);
        });

        // Update Dynamic Feedback/Suggestions based on exact performance
        dynamicSuggestions.innerHTML = '';
        const feedback = generateFeedback(overallScore, keywords, formatting, impact, missingKws);

        feedback.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="suggest-icon ${item.isPositive ? 'good' : 'warn'}">
                    ${item.isPositive ? '✓' : '!'}
                </div>
                <span>${item.text}</span>
            `;
            dynamicSuggestions.appendChild(li);
        });
    }

    function generateFeedback(overall, kScore, fScore, iScore, missingKws) {
        let items = [];

        // Overall Feedback
        if (overall >= 75) {
            items.push({ text: "Strong resume! You have a great overall compatibility and structure.", isPositive: true });
        } else if (overall >= 50) {
            items.push({ text: "Your resume is average. Make specific adjustments to stand out.", isPositive: false });
        } else {
            items.push({ text: "Your resume is currently weak for this job role. Major improvements needed.", isPositive: false });
        }

        // Keywords Feedback
        if (kScore > 75) {
            items.push({ text: "Excellent job parsing keywords naturally into your resume.", isPositive: true });
        } else {
            const missingTxt = missingKws.length > 0 ? missingKws.slice(0, 3).join(', ') : 'more contextual terms';
            items.push({ text: `Consider adding these missing keywords from the job role: ${missingTxt}`, isPositive: false });
        }

        // Impact Feedback
        if (iScore < 50) {
            items.push({ text: "Low impact score: Include more active verbs like 'managed', 'created', or 'developed'.", isPositive: false });
        } else {
            items.push({ text: "Your bullet points show strong active impact.", isPositive: true });
        }

        // Formatting Feedback
        if (fScore < 50) {
            items.push({ text: "Poor structural format detected. Make sure to use bullet points and clear sections.", isPositive: false });
        }
        
        return items;
    }
});
