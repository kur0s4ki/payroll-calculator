// app.js

// Base URL for the API
const API_BASE_URL = "http://localhost:3000";

// Helper Functions
function showLoading() {
  document.getElementById("loading-spinner").classList.remove("d-none");
}

function hideLoading() {
  document.getElementById("loading-spinner").classList.add("d-none");
}

function showError(message) {
  const errorAlert = document.getElementById("error-alert");
  errorAlert.textContent = message;
  errorAlert.classList.remove("d-none");
  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  document.getElementById("error-alert").classList.add("d-none");
}

// Event Listeners for Navigation
document.getElementById("nav-home").addEventListener("click", (event) => {
  event.preventDefault();
  loadHomePage();
  setActiveNav("nav-home");
});

document.getElementById("nav-employees").addEventListener("click", (event) => {
  event.preventDefault();
  loadEmployeeList();
  setActiveNav("nav-employees");
});

document.getElementById("nav-shifts").addEventListener("click", (event) => {
  event.preventDefault();
  loadShiftList();
  setActiveNav("nav-shifts");
});

document.getElementById("nav-calculate").addEventListener("click", (event) => {
  event.preventDefault();
  loadCalculatePayView();
  setActiveNav("nav-calculate");
});

document
  .getElementById("nav-daily-summary")
  .addEventListener("click", (event) => {
    event.preventDefault();
    loadDailySummaryView();
    setActiveNav("nav-daily-summary");
  });

function loadDailySummaryView() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
      <div id="daily-summary">
        <h2>Daily Summary</h2>
        <form id="daily-summary-form" class="mb-4">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="summary-employee" class="form-label">Employee</label>
              <select class="form-select" id="summary-employee" required>
                <!-- Employee options will be loaded here -->
              </select>
            </div>
            <div class="col-md-4 mb-3">
              <label for="summary-date" class="form-label">Date</label>
              <input type="date" class="form-control" id="summary-date" required />
            </div>
            <div class="col-md-4 align-self-end">
              <button type="submit" class="btn btn-primary">Get Summary</button>
            </div>
          </div>
        </form>
        <div id="daily-summary-results">
          <!-- Daily summary results will be displayed here -->
        </div>
      </div>
    `;

  // Load employees into the select dropdown
  fetch(`${API_BASE_URL}/employees`)
    .then((response) => response.json())
    .then((employees) => {
      const employeeSelect = document.getElementById("summary-employee");
      employeeSelect.innerHTML = "";
      employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.text = employee.name;
        employeeSelect.add(option);
      });
    });

  document
    .getElementById("daily-summary-form")
    .addEventListener("submit", handleDailySummarySubmit);
}

function handleDailySummarySubmit(event) {
  event.preventDefault();

  const employeeId = document.getElementById("summary-employee").value;
  const date = document.getElementById("summary-date").value;

  showLoading();

  fetch(
    `${API_BASE_URL}/shifts/employee/${employeeId}/daily-summary?date=${date}`
  )
    .then((response) => response.json())
    .then((data) => {
      hideLoading();
      displayDailySummaryResults(data);
    })
    .catch((error) => {
      hideLoading();
      console.error("Error fetching daily summary:", error);
      showError("Error fetching daily summary");
    });
}

function displayDailySummaryResults(summary) {
  const resultsDiv = document.getElementById("daily-summary-results");

  if (summary.message) {
    resultsDiv.innerHTML = `<p>${summary.message}</p>`;
    return;
  }

  let resultsHTML = `
    <h3>Daily Summary</h3>
    <div class="accordion" id="summaryAccordion">
  `;

  summary.forEach((shift, index) => {
    resultsHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${index}">
          <button
            class="accordion-button ${index > 0 ? "collapsed" : ""}"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#collapse${index}"
            aria-expanded="${index === 0 ? "true" : "false"}"
            aria-controls="collapse${index}"
          >
            ${shift.shiftType} - ${new Date(
      shift.hoursWorked
    ).toLocaleDateString()}
          </button>
        </h2>
        <div
          id="collapse${index}"
          class="accordion-collapse collapse ${index === 0 ? "show" : ""}"
          aria-labelledby="heading${index}"
          data-bs-parent="#summaryAccordion"
        >
          <div class="accordion-body">
            <p><strong>Shift Reference:</strong> ${shift.shiftRef || "N/A"}</p>
            <ul>
              <li><strong>Hours Worked:</strong> ${shift.hoursWorked.toFixed(
                2
              )} hrs</li>
              <li><strong>Break Time:</strong> ${shift.breakTime.toFixed(
                2
              )} hrs</li>
              <li><strong>Actual Hours Worked:</strong> ${shift.actualHoursWorked.toFixed(
                2
              )} hrs</li>
              <li><strong>Voluntary Overtime (VOT) Hours:</strong> ${shift.votHours.toFixed(
                2
              )} hrs</li>
              <li><strong>Fatigue Break Time:</strong> ${shift.fatTime.toFixed(
                2
              )} hrs</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  resultsHTML += "</div>";
  resultsDiv.innerHTML = resultsHTML;
}

// Function to set active navigation item
function setActiveNav(navId) {
  const navItems = document.querySelectorAll(".nav-link");
  navItems.forEach((item) => {
    item.classList.remove("active");
  });
  document.getElementById(navId).classList.add("active");
}

// Load Home Page
function loadHomePage() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <div id="home-page">
      <h1>Welcome to the Payroll Calculator</h1>
      <p class="text-center">Use the navigation menu to manage employees, shifts, and calculate pay.</p>
    </div>
  `;
}

// Initial load
loadHomePage();

// Employee Management Functions
function loadEmployeeList() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <!-- Employee List -->
    <div id="employee-list">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Employees</h2>
        <button class="btn btn-primary" id="add-employee-btn">Add Employee</button>
      </div>
      <div id="employee-table-container">
        <!-- Employee table will be loaded here -->
      </div>
    </div>
  `;

  document
    .getElementById("add-employee-btn")
    .addEventListener("click", showAddEmployeeModal);

  fetchEmployees();
}

function fetchEmployees() {
  showLoading();
  fetch(`${API_BASE_URL}/employees`)
    .then((response) => response.json())
    .then((data) => {
      hideLoading();
      displayEmployeeTable(data);
    })
    .catch((error) => {
      hideLoading();
      console.error("Error fetching employees:", error);
      showError("Error fetching employees");
    });
}

function displayEmployeeTable(employees) {
  const tableContainer = document.getElementById("employee-table-container");
  if (employees.length === 0) {
    tableContainer.innerHTML = "<p>No employees found.</p>";
    return;
  }
  let tableHTML = `
      <table class="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rate 1</th>
            <th>Rate 2</th>
            <th>Rate 3</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
    `;

  employees.forEach((employee) => {
    console.log(
      "Type of rate1:",
      typeof employee.rate1,
      "Value:",
      employee.rate1
    );

    // Convert rates to numbers
    const rate1 = parseFloat(employee.rate1);
    const rate2 = employee.rate2 !== null ? parseFloat(employee.rate2) : null;
    const rate3 = employee.rate3 !== null ? parseFloat(employee.rate3) : null;

    tableHTML += `
        <tr>
          <td>${employee.name}</td>
          <td>$${rate1.toFixed(2)}</td>
          <td>$${rate2 !== null ? rate2.toFixed(2) : "-"}</td>
          <td>$${rate3 !== null ? rate3.toFixed(2) : "-"}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${
              employee.id
            }')">Delete</button>
          </td>
        </tr>
      `;
  });

  tableHTML += `
        </tbody>
      </table>
    `;

  tableContainer.innerHTML = tableHTML;
}

// Show Add Employee Modal
function showAddEmployeeModal() {
  // Set modal title
  document.getElementById("employeeModalLabel").innerText = "Add Employee";
  // Clear form
  document.getElementById("employee-form").reset();
  // Show modal
  const employeeModal = new bootstrap.Modal(
    document.getElementById("employeeModal")
  );
  employeeModal.show();
}

// Handle Employee Form Submission
document.getElementById("employee-form").addEventListener("submit", (event) => {
  event.preventDefault();
  // Get form values
  const name = document.getElementById("employee-name").value;
  const rate1 = parseFloat(document.getElementById("employee-rate1").value);
  const rate2Value = document.getElementById("employee-rate2").value;
  const rate3Value = document.getElementById("employee-rate3").value;
  const rate2 = rate2Value ? parseFloat(rate2Value) : null;
  const rate3 = rate3Value ? parseFloat(rate3Value) : null;

  // Create employee object
  const employee = {
    name,
    rate1,
    rate2,
    rate3,
  };

  showLoading();

  // Send POST request to create employee
  fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(employee),
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoading();
      alert("Employee added successfully");
      // Close modal
      const employeeModal = bootstrap.Modal.getInstance(
        document.getElementById("employeeModal")
      );
      employeeModal.hide();
      // Reload employee list
      loadEmployeeList();
    })
    .catch((error) => {
      hideLoading();
      console.error("Error adding employee:", error);
      showError("Error adding employee");
    });
});

// Delete Employee
function deleteEmployee(employeeId) {
  if (!confirm("Are you sure you want to delete this employee?")) return;

  showLoading();

  fetch(`${API_BASE_URL}/employees/${employeeId}`, {
    method: "DELETE",
  })
    .then((response) => {
      hideLoading();
      if (response.ok) {
        alert("Employee deleted successfully");
        loadEmployeeList();
      } else {
        showError("Error deleting employee");
      }
    })
    .catch((error) => {
      hideLoading();
      console.error("Error deleting employee:", error);
      showError("Error deleting employee");
    });
}

// Shift Management Functions
function loadShiftList() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <!-- Shift List -->
    <div id="shift-list">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h2>Shifts</h2>
        <button class="btn btn-primary" id="add-shift-btn">Add Shift</button>
      </div>
      <div id="shift-table-container">
        <!-- Shift table will be loaded here -->
      </div>
    </div>
  `;

  document
    .getElementById("add-shift-btn")
    .addEventListener("click", showAddShiftModal);

  fetchShifts();
}

function fetchShifts() {
  showLoading();
  fetch(`${API_BASE_URL}/shifts`)
    .then((response) => response.json())
    .then((data) => {
      hideLoading();
      displayShiftTable(data);
    })
    .catch((error) => {
      hideLoading();
      console.error("Error fetching shifts:", error);
      showError("Error fetching shifts");
    });
}

function displayShiftTable(shifts) {
  const tableContainer = document.getElementById("shift-table-container");
  if (shifts.length === 0) {
    tableContainer.innerHTML = "<p>No shifts found.</p>";
    return;
  }
  let tableHTML = `
    <table class="table table-striped">
      <thead>
        <tr>
          <th>Date</th>
          <th>Employee</th>
          <th>Shift Type</th>
          <th>Start Time</th>
          <th>Finish Time</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  shifts.forEach((shift) => {
    tableHTML += `
      <tr>
        <td>${new Date(shift.date).toLocaleDateString()}</td>
        <td>${shift.employee.name}</td>
        <td>${shift.shiftType}</td>
        <td>${shift.startTime}</td>
        <td>${shift.finishTime}</td>
        <td>
          <button class="btn btn-sm btn-danger" onclick="deleteShift('${
            shift.id
          }')">Delete</button>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  tableContainer.innerHTML = tableHTML;
}

// Show Add Shift Modal
function showAddShiftModal() {
  // Set modal title
  document.getElementById("shiftModalLabel").innerText = "Add Shift";
  // Clear form
  document.getElementById("shift-form").reset();
  // Clear breaks
  document.getElementById("breaks-container").innerHTML = "";
  // Load employees into the select dropdown
  fetch(`${API_BASE_URL}/employees`)
    .then((response) => response.json())
    .then((employees) => {
      const employeeSelect = document.getElementById("shift-employee");
      employeeSelect.innerHTML = "";
      employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.text = employee.name;
        employeeSelect.add(option);
      });
    });
  // Load shift types
  const shiftTypes = [
    "SUNDAY",
    "SATURDAY",
    "BROKEN",
    "STRAIGHT",
    "DOC",
    "DOCSAT",
    "AOC",
    "PHOL",
    "PHOLnotWRKD",
    "SICK",
    "LEAVE",
    "OFF",
    "RDO",
  ];
  const shiftTypeSelect = document.getElementById("shift-type");
  shiftTypeSelect.innerHTML = "";
  shiftTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.text = type;
    shiftTypeSelect.add(option);
  });
  // Show modal
  const shiftModal = new bootstrap.Modal(document.getElementById("shiftModal"));
  shiftModal.show();
}

// Handle adding breaks
document.getElementById("add-break-btn").addEventListener("click", () => {
  const breaksContainer = document.getElementById("breaks-container");
  const breakIndex = breaksContainer.children.length;
  const breakDiv = document.createElement("div");
  breakDiv.classList.add("mb-2", "break-item");
  breakDiv.innerHTML = `
    <label>Break ${breakIndex + 1}</label>
    <div class="input-group">
      <input type="time" class="form-control" name="break-start-${breakIndex}" required />
      <span class="input-group-text">to</span>
      <input type="time" class="form-control" name="break-finish-${breakIndex}" required />
      <button type="button" class="btn btn-sm btn-danger remove-break-btn">Remove</button>
    </div>
  `;
  breaksContainer.appendChild(breakDiv);
});

// Handle removing breaks
document
  .getElementById("breaks-container")
  .addEventListener("click", (event) => {
    if (event.target.classList.contains("remove-break-btn")) {
      event.target.closest(".break-item").remove();
    }
  });

// Add VOT
document.getElementById("add-vot-btn").addEventListener("click", () => {
  const votsContainer = document.getElementById("vots-container");
  const votIndex = votsContainer.children.length;
  const votDiv = document.createElement("div");
  votDiv.classList.add("mb-2", "vot-item");
  votDiv.innerHTML = `
      <label>VOT ${votIndex + 1}</label>
      <div class="input-group">
          <input type="time" class="form-control" name="vot-start-${votIndex}" required />
          <span class="input-group-text">to</span>
          <input type="time" class="form-control" name="vot-finish-${votIndex}" />
          <button type="button" class="btn btn-sm btn-danger remove-vot-btn">Remove</button>
      </div>
  `;
  votsContainer.appendChild(votDiv);
});

// Add FAT
document.getElementById("add-fat-btn").addEventListener("click", () => {
  const fatsContainer = document.getElementById("fats-container");
  const fatIndex = fatsContainer.children.length;
  const fatDiv = document.createElement("div");
  fatDiv.classList.add("mb-2", "fat-item");
  fatDiv.innerHTML = `
      <label>FAT ${fatIndex + 1}</label>
      <div class="input-group">
          <input type="time" class="form-control" name="fat-start-${fatIndex}" required />
          <span class="input-group-text">to</span>
          <input type="time" class="form-control" name="fat-finish-${fatIndex}" required />
          <button type="button" class="btn btn-sm btn-danger remove-fat-btn">Remove</button>
      </div>
  `;
  fatsContainer.appendChild(fatDiv);
});

// Remove VOT or FAT
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("remove-vot-btn")) {
    event.target.closest(".vot-item").remove();
  }
  if (event.target.classList.contains("remove-fat-btn")) {
    event.target.closest(".fat-item").remove();
  }
});

// Handle Shift Form Submission
document.getElementById("shift-form").addEventListener("submit", (event) => {
  event.preventDefault();

  // Collect form data
  const employeeId = document.getElementById("shift-employee").value;
  const date = document.getElementById("shift-date").value;
  const shiftType = document.getElementById("shift-type").value;
  const payRate = document.getElementById("shift-pay-rate").value;
  const special = document.getElementById("shift-special").value === "YES";
  const startTime = new Date(
    `${date}T${document.getElementById("shift-start-time").value}:00`
  ).toISOString();
  const finishTime = new Date(
    `${date}T${document.getElementById("shift-finish-time").value}:00`
  ).toISOString();

  // Collect Breaks
  const breaksContainer = document.getElementById("breaks-container");
  const breakItems = breaksContainer.getElementsByClassName("break-item");
  const breaks = Array.from(breakItems).map((item) => {
    const start = item.querySelector('input[name^="break-start"]').value;
    const finish = item.querySelector('input[name^="break-finish"]').value;
    return {
      startTime: new Date(`${date}T${start}:00`).toISOString(),
      endTime: new Date(`${date}T${finish}:00`).toISOString(),
    };
  });

  // Collect VOTs
  const votsContainer = document.getElementById("vots-container");
  const votItems = votsContainer.getElementsByClassName("vot-item");
  const voluntaryOvertimes = Array.from(votItems).map((item) => {
    const start = item.querySelector('input[name^="vot-start"]').value;
    const finish = item.querySelector('input[name^="vot-finish"]').value;
    return {
      startTime: new Date(`${date}T${start}:00`).toISOString(),
      endTime: finish
        ? new Date(`${date}T${finish}:00`).toISOString()
        : undefined,
    };
  });

  // Collect FATs
  const fatsContainer = document.getElementById("fats-container");
  const fatItems = fatsContainer.getElementsByClassName("fat-item");
  const fatigueBreaks = Array.from(fatItems).map((item) => {
    const start = item.querySelector('input[name^="fat-start"]').value;
    const finish = item.querySelector('input[name^="fat-finish"]').value;
    return {
      startTime: new Date(`${date}T${start}:00`).toISOString(),
      endTime: new Date(`${date}T${finish}:00`).toISOString(),
    };
  });

  // Create shift object
  const shift = {
    employeeId,
    date,
    shiftType,
    payRate,
    special,
    startTime,
    finishTime,
    breaks,
    voluntaryOvertimes,
    fatigueBreaks,
  };

  showLoading();

  // Send POST request
  fetch(`${API_BASE_URL}/shifts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(shift),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then((err) => {
          throw new Error(err.message || "Error adding shift");
        });
      }
      return response.json();
    })
    .then(() => {
      hideLoading();
      alert("Shift added successfully");
      const shiftModal = bootstrap.Modal.getInstance(
        document.getElementById("shiftModal")
      );
      shiftModal.hide();
      loadShiftList();
    })
    .catch((error) => {
      hideLoading();
      console.error("Error adding shift:", error);
      showError(error.message);
    });
});

// Delete Shift
function deleteShift(shiftId) {
  if (!confirm("Are you sure you want to delete this shift?")) return;

  showLoading();

  fetch(`${API_BASE_URL}/shifts/${shiftId}`, {
    method: "DELETE",
  })
    .then((response) => {
      hideLoading();
      if (response.ok) {
        alert("Shift deleted successfully");
        loadShiftList();
      } else {
        showError("Error deleting shift");
      }
    })
    .catch((error) => {
      hideLoading();
      console.error("Error deleting shift:", error);
      showError("Error deleting shift");
    });
}

// Payroll Calculation Functions
function loadCalculatePayView() {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = `
    <!-- Calculate Pay -->
    <div id="calculate-pay">
      <h2>Calculate Pay</h2>
      <form id="calculate-pay-form" class="mb-4">
        <div class="row">
          <div class="col-md-4 mb-3">
            <label for="calc-employee" class="form-label">Employee</label>
            <select class="form-select" id="calc-employee" required>
              <!-- Employee options will be loaded here -->
            </select>
          </div>
          <div class="col-md-3 mb-3">
            <label for="calc-start-date" class="form-label">Start Date</label>
            <input type="date" class="form-control" id="calc-start-date" required />
          </div>
          <div class="col-md-3 mb-3">
            <label for="calc-end-date" class="form-label">End Date</label>
            <input type="date" class="form-control" id="calc-end-date" required />
          </div>
          <div class="col-md-2 align-self-end">
            <button type="submit" class="btn btn-primary">Calculate</button>
          </div>
        </div>
      </form>
      <div id="pay-results">
        <!-- Pay results will be displayed here -->
      </div>
    </div>
  `;
  // Load employees into the select dropdown
  fetch(`${API_BASE_URL}/employees`)
    .then((response) => response.json())
    .then((employees) => {
      const employeeSelect = document.getElementById("calc-employee");
      employeeSelect.innerHTML = "";
      employees.forEach((employee) => {
        const option = document.createElement("option");
        option.value = employee.id;
        option.text = employee.name;
        employeeSelect.add(option);
      });
    });

  document
    .getElementById("calculate-pay-form")
    .addEventListener("submit", handleCalculatePay);
}

// Handle Calculate Pay Form Submission
function handleCalculatePay(event) {
  event.preventDefault();
  // Get form values
  const employeeId = document.getElementById("calc-employee").value;
  const startDate = document.getElementById("calc-start-date").value;
  const endDate = document.getElementById("calc-end-date").value;

  showLoading();

  // Send POST request to calculate pay
  fetch(`${API_BASE_URL}/calculate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ employeeId, startDate, endDate }),
  })
    .then((response) => response.json())
    .then((data) => {
      hideLoading();
      displayPayResults(data);
    })
    .catch((error) => {
      hideLoading();
      console.error("Error calculating pay:", error);
      showError("Error calculating pay");
    });
}

// Function to display pay results
function displayPayResults(payData) {
  const payResultsDiv = document.getElementById("pay-results");
  if (payData.shifts.length === 0) {
    payResultsDiv.innerHTML = "<p>No shifts found for the selected period.</p>";
    return;
  }
  let resultsHTML = `
    <h3>Total Pay: $${payData.totalPay.toFixed(2)}</h3>
    <div class="accordion" id="payAccordion">
  `;

  payData.shifts.forEach((shift, index) => {
    resultsHTML += `
      <div class="accordion-item">
        <h2 class="accordion-header" id="heading${index}">
          <button class="accordion-button ${
            index > 0 ? "collapsed" : ""
          }" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}" aria-expanded="${
      index === 0 ? "true" : "false"
    }" aria-controls="collapse${index}">
            ${new Date(shift.date).toLocaleDateString()} - ${shift.shiftType}
          </button>
        </h2>
        <div id="collapse${index}" class="accordion-collapse collapse ${
      index === 0 ? "show" : ""
    }" aria-labelledby="heading${index}" data-bs-parent="#payAccordion">
          <div class="accordion-body">
            <p><strong>Total Shift Pay:</strong> $${shift.payComponents.totalShiftPay.toFixed(
              2
            )}</p>
            <ul>
              <li>Ordinary Pay: $${shift.payComponents.ordinaryPay.toFixed(
                2
              )}</li>
              <li>Overtime Pay: $${shift.payComponents.overtimePay.toFixed(
                2
              )}</li>
              <li>Penalty Pay: $${shift.payComponents.penaltyPay.toFixed(
                2
              )}</li>
              <li>Special Pay: $${shift.payComponents.specialPay.toFixed(
                2
              )}</li>
              ${
                shift.payComponents.publicHolidayPay
                  ? `<li>Public Holiday Pay: $${shift.payComponents.publicHolidayPay.toFixed(
                      2
                    )}</li>`
                  : ""
              }
              ${
                shift.payComponents.leaveLoading
                  ? `<li>Leave Loading: $${shift.payComponents.leaveLoading.toFixed(
                      2
                    )}</li>`
                  : ""
              }
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  resultsHTML += "</div>";

  payResultsDiv.innerHTML = resultsHTML;
}
