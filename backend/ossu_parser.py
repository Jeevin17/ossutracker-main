import re
import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import logging

logger = logging.getLogger(__name__)

class OSSSUCurriculumParser:
    """Parser to extract course data from OSSU Computer Science curriculum."""
    
    OSSU_README_URL = "https://raw.githubusercontent.com/ossu/computer-science/master/README.md"
    OSSU_REPO_BASE = "https://github.com/ossu/computer-science"
    
    def __init__(self):
        self.category_mapping = {
            "intro cs": "intro_cs",
            "core programming": "core_programming", 
            "core math": "core_math",
            "cs tools": "cs_tools",
            "core systems": "core_systems",
            "core theory": "core_theory",
            "core security": "core_security",
            "core applications": "core_applications",
            "core ethics": "core_ethics",
            "advanced programming": "advanced_programming",
            "advanced systems": "advanced_systems",
            "advanced theory": "advanced_theory",
            "advanced information security": "advanced_security",
            "advanced math": "advanced_math",
            "final project": "final_project"
        }

    def fetch_ossu_readme(self) -> str:
        """Fetch the README.md content from OSSU repository."""
        try:
            response = requests.get(self.OSSU_README_URL, timeout=30)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Failed to fetch OSSU README: {e}")
            raise Exception(f"Failed to fetch OSSU curriculum: {e}")

    def clean_description_noise(self, text: str) -> str:
        """Clean noise from course descriptions."""
        if not text:
            return ""
        
        # Remove markdown links but keep the text
        cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        
        # Remove excessive asterisks, backticks, and formatting
        cleaned = re.sub(r'\*{2,}', '', cleaned)
        cleaned = re.sub(r'`{1,}', '', cleaned)
        cleaned = re.sub(r'_{2,}', '', cleaned)
        
        # Remove common noise patterns
        noise_patterns = [
            r'Computer Science\s*•\s*',
            r'Topics covered:\s*',
            r'\*\*Topics covered\*\*:\s*',
            r'\s*and more\s*',
            r'`[^`]*`',  # Remove remaining backtick content
            r'\s+', # Multiple spaces to single space
        ]
        
        for pattern in noise_patterns:
            if pattern == r'\s+':
                cleaned = re.sub(pattern, ' ', cleaned)
            else:
                cleaned = re.sub(pattern, '', cleaned, flags=re.IGNORECASE)
        
        return cleaned.strip()

    def extract_topics_from_text(self, text: str) -> List[str]:
        """Extract topics from topics covered section."""
        if not text:
            return []
        
        # Look for topics covered pattern
        topics_match = re.search(r'topics covered[:\s]*(.+?)(?:\n|$)', text, re.IGNORECASE | re.DOTALL)
        if not topics_match:
            return []
        
        topics_text = topics_match.group(1)
        topics_text = re.sub(r'`', '', topics_text)  # Remove backticks
        
        # Split by common delimiters and clean
        topics = re.split(r'[,•·\n]', topics_text)
        cleaned_topics = []
        
        for topic in topics:
            topic = topic.strip()
            if topic and len(topic) > 2 and topic.lower() not in ['and more', 'more', 'etc']:
                cleaned_topics.append(topic)
        
        return cleaned_topics[:10]  # Limit to 10 topics

    def parse_course_table(self, table_text: str, category: str) -> List[Dict[str, Any]]:
        """Parse a course table from markdown text."""
        courses = []
        
        # Split into lines and find table rows
        lines = table_text.split('\n')
        table_started = False
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and header separators
            if not line or line.startswith('|---') or line.startswith('| :--'):
                continue
            
            # Check if this is a table row with course data
            if line.startswith('|') and '|' in line[1:]:
                cells = [cell.strip() for cell in line.split('|')[1:-1]]  # Remove first/last empty cells
                
                # Skip header row
                if len(cells) >= 4 and cells[0].lower() in ['courses', 'course']:
                    table_started = True
                    continue
                
                if table_started and len(cells) >= 4:
                    course_name = cells[0].strip()
                    
                    # Skip if this doesn't look like a course name
                    if not course_name or course_name.lower() in ['courses', 'course']:
                        continue
                    
                    # Extract course URL from markdown links
                    course_url = self.extract_url_from_markdown(course_name)
                    clean_course_name = self.clean_markdown_text(course_name)
                    
                    duration = cells[1].strip() if len(cells) > 1 else ""
                    effort = cells[2].strip() if len(cells) > 2 else ""
                    prerequisites_text = cells[3].strip() if len(cells) > 3 else ""
                    
                    # Parse duration into weeks
                    duration_weeks = self.parse_duration(duration)
                    
                    # Parse prerequisites
                    prerequisites = self.parse_prerequisites(prerequisites_text)
                    
                    courses.append({
                        'title': clean_course_name,
                        'url': course_url,
                        'ossu_url': f"{self.OSSU_REPO_BASE}#{category.replace('_', '-')}",
                        'duration_weeks': duration_weeks,
                        'effort_hours_per_week': effort,
                        'prerequisites': prerequisites,
                        'category': category,
                        'topics_covered': []  # Will be filled later
                    })
        
        return courses

    def extract_url_from_markdown(self, text: str) -> str:
        """Extract URL from markdown link format."""
        link_match = re.search(r'\[([^\]]+)\]\(([^\)]+)\)', text)
        if link_match:
            return link_match.group(2)
        return ""

    def clean_markdown_text(self, text: str) -> str:
        """Clean markdown formatting from text."""
        # Remove markdown links, keep text
        cleaned = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
        # Remove other markdown formatting
        cleaned = re.sub(r'[*_`#]', '', cleaned)
        return cleaned.strip()

    def parse_duration(self, duration_str: str) -> Optional[int]:
        """Parse duration string to extract weeks."""
        if not duration_str:
            return None
        
        # Look for number followed by "weeks"
        week_match = re.search(r'(\d+)(?:-\d+)?\s*weeks?', duration_str.lower())
        if week_match:
            return int(week_match.group(1))
        
        return None

    def parse_prerequisites(self, prereq_text: str) -> List[str]:
        """Parse prerequisites from text."""
        if not prereq_text or prereq_text.lower().strip() in ['-', 'none', '']:
            return []
        
        # Clean markdown formatting
        clean_text = self.clean_markdown_text(prereq_text)
        
        # Split by common delimiters
        prereqs = re.split(r'[,;]', clean_text)
        
        # Clean and filter prerequisites
        cleaned_prereqs = []
        for prereq in prereqs:
            prereq = prereq.strip()
            if prereq and len(prereq) > 2:
                cleaned_prereqs.append(prereq)
        
        return cleaned_prereqs[:5]  # Limit to 5 prerequisites

    def parse_ossu_curriculum(self) -> List[Dict[str, Any]]:
        """Parse the complete OSSU curriculum and extract all courses."""
        readme_content = self.fetch_ossu_readme()
        all_courses = []
        
        # Split content into sections
        sections = self.split_into_sections(readme_content)
        
        for section_title, section_content in sections.items():
            category = self.get_category_from_title(section_title)
            if not category:
                continue
            
            logger.info(f"Processing section: {section_title} -> {category}")
            
            # Extract topics covered for this section
            topics = self.extract_topics_from_text(section_content)
            
            # Parse courses from tables in this section
            courses = self.parse_course_table(section_content, category)
            
            # Add topics to each course
            for course in courses:
                course['topics_covered'] = topics
                course['description'] = self.generate_description(course, topics)
                
            all_courses.extend(courses)
            logger.info(f"Found {len(courses)} courses in {section_title}")
        
        logger.info(f"Total courses parsed: {len(all_courses)}")
        return all_courses

    def split_into_sections(self, content: str) -> Dict[str, str]:
        """Split README content into curriculum sections."""
        sections = {}
        current_section = None
        current_content = []
        
        lines = content.split('\n')
        
        for line in lines:
            # Check for section headers (## or ###)
            header_match = re.match(r'^#{2,3}\s+(.+)$', line.strip())
            
            if header_match:
                # Save previous section
                if current_section:
                    sections[current_section] = '\n'.join(current_content)
                
                # Start new section
                section_title = header_match.group(1).strip()
                current_section = section_title
                current_content = [line]
            elif current_section:
                current_content.append(line)
        
        # Save last section
        if current_section:
            sections[current_section] = '\n'.join(current_content)
        
        return sections

    def get_category_from_title(self, title: str) -> Optional[str]:
        """Map section title to category."""
        title_lower = title.lower().strip()
        
        # Direct matches
        if title_lower in self.category_mapping:
            return self.category_mapping[title_lower]
        
        # Partial matches
        for key, category in self.category_mapping.items():
            if key in title_lower:
                return category
        
        return None

    def generate_description(self, course: Dict[str, Any], topics: List[str]) -> str:
        """Generate a clean description for the course."""
        base_desc = f"Learn {', '.join(topics[:3])} and more in this comprehensive course."
        
        if course.get('duration_weeks'):
            base_desc += f" This {course['duration_weeks']}-week course"
            if course.get('effort_hours_per_week'):
                base_desc += f" requires {course['effort_hours_per_week']}"
            base_desc += " and is part of the OSSU Computer Science curriculum."
        
        return self.clean_description_noise(base_desc)

# Usage example
if __name__ == "__main__":
    parser = OSSSUCurriculumParser()
    try:
        courses = parser.parse_ossu_curriculum()
        print(f"Successfully parsed {len(courses)} courses")
        for course in courses[:3]:  # Show first 3 as example
            print(f"- {course['title']} ({course['category']})")
    except Exception as e:
        print(f"Error: {e}")