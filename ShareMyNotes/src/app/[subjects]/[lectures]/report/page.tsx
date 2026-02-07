'use client'

import Link from 'next/link'
import { Button } from '@/components/Button/Button'
import { Icon } from '@/components/Icon/Icon'
import { appName, appDescription } from '@/lib/constants'
import { Navbar } from '@/components/Navbar/Navbar'
import TextReader from '@/components/TextReader/TextReader'

const mockReportText = `
# Course Report

## Overview
This is a sample report for the course. It contains detailed information about the course content, assessments, and student progress.

## Module 1: Introduction
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

## Module 2: Core Concepts
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Module 3: Advanced Topics
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Assessment Results
- Quiz 1: 85%
- Quiz 2: 90%
- Midterm Exam: 88%
- Final Project: 92%

## Conclusion
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Additional Resources
- Textbook Chapter 1-5
- Online Video Lectures
- Discussion Forum Links
- Practice Problems with Solutions

---
Generated on: January 2026
`;

export default function ReportPage() {
  async function handleGenerateReport() {
    // TODO: Call API to generate report
    console.log('Generate report clicked')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-text-primary">Report</h1>
            <button
              onClick={handleGenerateReport}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold"
            >
              Generate Report
            </button>
          </div>
          
          <TextReader content={mockReportText} height={600} />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: 'upload' | 'users' | 'message', title: string, description: string }) {
  return (
    <div className="note-card p-6 rounded-xl transition-all duration-200">
      <div className="w-12 h-12 bg-background-muted rounded-lg flex items-center justify-center mb-4">
        <Icon name={icon} size={24} className="text-text-primary" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary">{description}</p>
    </div>
  )
}

function StepCard({ number, title, description }: { number: number, title: string, description: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 bg-text-primary text-background rounded-full flex items-center justify-center mx-auto mb-4 font-bold">
        {number}
      </div>
      <h3 className="font-bold text-text-primary mb-1">{title}</h3>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
  )
}
