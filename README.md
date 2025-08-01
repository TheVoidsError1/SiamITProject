# 🏢 SiamIT Leave Management System

A comprehensive web-based leave management system designed for modern organizations, featuring multi-language support, role-based access control, and intuitive user interfaces.

## ✨ Features

### 🔐 Authentication & Authorization
- Secure login/logout system with JWT authentication
- Role-based access control (Employee, Admin, Super Admin)
- Password management and security features

### 📅 Leave Management
- **Leave Request System**: Submit, approve, and track leave requests
- **Multiple Leave Types**: Support for various leave categories
- **Calendar Integration**: Visual calendar for leave planning
- **Leave History**: Comprehensive tracking of all leave activities
- **File Upload**: Attach supporting documents to leave requests

### 👥 Employee Management
- **Employee Profiles**: Detailed employee information management
- **Department Management**: Organizational structure support
- **Position Tracking**: Role and position management
- **Employee Dashboard**: Personalized views for each user

### 📊 Admin Features
- **Admin Dashboard**: Comprehensive overview and analytics
- **Leave Approval Workflow**: Streamlined approval process
- **Employee Management**: Add, edit, and manage employee records
- **Reports & Analytics**: Data visualization and reporting tools

### 🎯 Super Admin Capabilities
- **System-wide Management**: Complete system administration
- **User Management**: Full control over all user accounts
- **System Configuration**: Global settings and configurations

### 📢 Communication
- **Announcements**: Company-wide announcement system
- **Notifications**: Real-time notification system
- **Multi-language Support**: Thai and English language support

### 📱 User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Modern UI**: Clean, intuitive interface using shadcn/ui
- **Dark/Light Mode**: Theme customization options
- **Accessibility**: WCAG compliant design

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful and accessible UI components
- **React Router** - Client-side routing
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **i18next** - Internationalization
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeORM** - Object-relational mapping
- **MySQL** - Relational database
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Swagger** - API documentation
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- MySQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SiamITLeave
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd Backend
   npm install
   ```

4. **Configure environment variables**
   - Create `.env` files for both frontend and backend
   - Set up database connection strings
   - Configure JWT secrets and other environment variables

5. **Start development servers**

   **Frontend:**
   ```bash
   npm run dev
   ```

   **Backend:**
   ```bash
   cd Backend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

## 📁 Project Structure

```
SiamITLeave/
├── src/                    # Frontend source code
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── i18n/              # Internationalization
│   └── constants/         # Application constants
├── Backend/               # Backend source code
│   ├── api/               # API controllers
│   ├── EntityTable/       # Database entities
│   ├── middleware/        # Express middleware
│   └── uploads/           # File uploads
├── public/                # Static assets
└── docs/                  # Documentation
```

## 🔧 Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## 🌐 Deployment

The application can be deployed using various methods:

- **Vercel** - For frontend deployment
- **Railway** - For full-stack deployment
- **AWS** - For scalable cloud deployment
- **Docker** - For containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Contact the development team

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting features
- [ ] Integration with HR systems
- [ ] Push notifications
- [ ] Advanced analytics dashboard
- [ ] API rate limiting
- [ ] Enhanced security features

---

**Built with ❤️ by the SiamIT Development Team**
