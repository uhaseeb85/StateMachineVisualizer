# IVR Flow Designer

## Overview
The IVR Flow Designer is a web-based application that allows users to define and manage Interactive Voice Response (IVR) authentication flows. Users can create states, define rules, manage tokens, and simulate the flow of customer interactions.

## Features
- **State Management**: Create, edit, and delete states.
- **Rule Management**: Define rules for each state with conditions and next states.
- **Simulation**: Simulate the flow of states and rules to visualize customer interactions.
- **Data Persistence**: Automatically saves the flow configuration to localStorage.
- **Import/Export**: Import and export flow configurations as JSON files.

## Technologies Used
- **React**: JavaScript library for building user interfaces.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Lucide React**: Icon library for React.
- **LocalStorage**: For data persistence.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/ivr-flow-designer.git
   cd ivr-flow-designer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000` to view the application.

## Usage
- Use the input field to add new states.
- Click on a state to edit its rules.
- Define rules with conditions and next states.
- Use the simulation feature to visualize the flow of states and rules.
- Save your flow configuration and export it as a JSON file.

## Contributing
Contributions are welcome! If you have suggestions for improvements or new features, feel free to open an issue or submit a pull request.

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments
- Thanks to the contributors of the libraries used in this project.